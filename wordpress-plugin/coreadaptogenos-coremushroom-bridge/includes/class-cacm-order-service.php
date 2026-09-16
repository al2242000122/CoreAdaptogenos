<?php

defined( 'ABSPATH' ) || exit;

final class CACM_Order_Service {
	private $factory;
	private $idempotency_store;
	private $clock;

	public function __construct( $factory, $idempotency_store, ?callable $clock = null ) {
		$this->factory           = $factory;
		$this->idempotency_store = $idempotency_store;
		$this->clock             = $clock ?? static fn (): int => time();
	}

	public function create_or_get( array $payload ) {
		$session_hash = hash( 'sha256', (string) $payload['session'] );
		$source_hash  = hash( 'sha256', CACM_Settings::origin() . '|' . (string) $payload['source_order_id'] );
		$fingerprint  = self::fingerprint( $payload );
		$existing     = $this->idempotency_store->get( $session_hash );

		if ( is_array( $existing ) ) {
			return $this->resolve_existing( $existing, $fingerprint, $session_hash );
		}

		if ( ! $this->idempotency_store->claim_source( $source_hash, $session_hash ) ) {
			return new WP_Error( 'cacm_source_order_conflict', 'El pedido de origen ya tiene otra sesión.', array( 'status' => 409 ) );
		}

		$now = ( $this->clock )();
		if ( ! $this->idempotency_store->claim( $session_hash, $fingerprint, $now ) ) {
			$existing = $this->idempotency_store->get( $session_hash );
			return is_array( $existing )
				? $this->resolve_existing( $existing, $fingerprint, $session_hash )
				: new WP_Error( 'cacm_session_busy', 'La sesión se está procesando.', array( 'status' => 409 ) );
		}

		try {
			$order = $this->factory->create( $payload, $session_hash );
			if ( is_wp_error( $order ) ) {
				$this->idempotency_store->release( $session_hash );
				$this->idempotency_store->release_source( $source_hash, $session_hash );
				return $order;
			}

			$this->idempotency_store->complete( $session_hash, $fingerprint, (int) $order->get_id() );
			return array( 'order' => $order, 'created' => true );
		} catch ( Throwable $error ) {
			$this->idempotency_store->release( $session_hash );
			$this->idempotency_store->release_source( $source_hash, $session_hash );
			return new WP_Error( 'cacm_order_creation_failed', 'No fue posible crear el pedido receptor.', array( 'status' => 500 ) );
		}
	}

	private function resolve_existing( array $record, string $fingerprint, string $session_hash ) {
		if ( ! isset( $record['fingerprint'] ) || ! hash_equals( (string) $record['fingerprint'], $fingerprint ) ) {
			return new WP_Error( 'cacm_session_conflict', 'La sesión ya existe con datos distintos.', array( 'status' => 409 ) );
		}

		if ( 'complete' !== ( $record['state'] ?? '' ) || empty( $record['order_id'] ) ) {
			$order = $this->find_order_by_session( $session_hash );
			if ( ! $order ) {
				return new WP_Error( 'cacm_session_busy', 'La sesión se está procesando.', array( 'status' => 409 ) );
			}
			$this->idempotency_store->complete( $session_hash, $fingerprint, (int) $order->get_id() );
			return array( 'order' => $order, 'created' => false );
		}

		$order = wc_get_order( (int) $record['order_id'] );
		if ( ! $order ) {
			return new WP_Error( 'cacm_order_missing', 'El pedido asociado a la sesión no existe.', array( 'status' => 500 ) );
		}

		return array( 'order' => $order, 'created' => false );
	}

	/** Recupera un pedido guardado si el proceso cayó después de crearlo. */
	private function find_order_by_session( string $session_hash ) {
		if ( ! function_exists( 'wc_get_orders' ) ) {
			return false;
		}
		$orders = wc_get_orders(
			array(
				'limit'      => 1,
				'return'     => 'objects',
				'meta_key'   => '_cacm_bridge_session_hash',
				'meta_value' => $session_hash,
			)
		);
		return is_array( $orders ) && isset( $orders[0] ) ? $orders[0] : false;
	}

	private static function fingerprint( array $payload ): string {
		$canonical = self::canonicalize( $payload );
		return hash( 'sha256', wp_json_encode( $canonical ) );
	}

	private static function canonicalize( $value ) {
		if ( ! is_array( $value ) ) {
			return $value;
		}

		if ( array_keys( $value ) !== range( 0, count( $value ) - 1 ) ) {
			ksort( $value, SORT_STRING );
		}

		foreach ( $value as $key => $item ) {
			$value[ $key ] = self::canonicalize( $item );
		}

		return $value;
	}
}

final class CACM_WP_Idempotency_Store {
	private const OPTION_PREFIX = '_cacm_session_';
	private const SOURCE_PREFIX = '_cacm_source_';

	public function get( string $session_hash ): ?array {
		$value = get_option( self::OPTION_PREFIX . $session_hash, null );
		return is_array( $value ) ? $value : null;
	}

	public function claim( string $session_hash, string $fingerprint, int $now ): bool {
		$option_name = self::OPTION_PREFIX . $session_hash;
		return add_option(
			$option_name,
			array(
				'state'       => 'creating',
				'fingerprint' => $fingerprint,
				'created_at'  => $now,
			),
			'',
			'no'
		);
	}

	public function claim_source( string $source_hash, string $session_hash ): bool {
		$option_name = self::SOURCE_PREFIX . $source_hash;
		$existing    = get_option( $option_name, '' );
		return hash_equals( $session_hash, (string) $existing ) || add_option( $option_name, $session_hash, '', 'no' );
	}

	public function release_source( string $source_hash, string $session_hash ): void {
		$option_name = self::SOURCE_PREFIX . $source_hash;
		if ( hash_equals( $session_hash, (string) get_option( $option_name, '' ) ) ) {
			delete_option( $option_name );
		}
	}

	public function complete( string $session_hash, string $fingerprint, int $order_id ): void {
		update_option(
			self::OPTION_PREFIX . $session_hash,
			array(
				'state'       => 'complete',
				'fingerprint' => $fingerprint,
				'order_id'    => $order_id,
			),
			false
		);
	}

	public function release( string $session_hash ): void {
		$record = $this->get( $session_hash );
		if ( is_array( $record ) && 'creating' === ( $record['state'] ?? '' ) ) {
			delete_option( self::OPTION_PREFIX . $session_hash );
		}
	}
}
