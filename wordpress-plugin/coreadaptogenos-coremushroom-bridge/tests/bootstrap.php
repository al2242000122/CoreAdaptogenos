<?php

declare(strict_types=1);

define( 'ABSPATH', __DIR__ . '/' );
define( 'HOUR_IN_SECONDS', 3600 );

final class CACM_Settings {
	public static function origin(): string {
		return 'https://core.bancodeesporas.com';
	}

	public static function stripe_environment(): string {
		return 'test';
	}
}

final class WP_Error {
	private string $code;
	private string $message;
	private array $data;

	public function __construct( string $code, string $message = '', array $data = array() ) {
		$this->code    = $code;
		$this->message = $message;
		$this->data    = $data;
	}

	public function get_error_code(): string {
		return $this->code;
	}

	public function get_error_message(): string {
		return $this->message;
	}

	public function get_error_data(): array {
		return $this->data;
	}
}

function is_wp_error( $value ): bool {
	return $value instanceof WP_Error;
}

function wp_json_encode( $value, int $flags = 0, int $depth = 512 ): string {
	return (string) json_encode( $value, $flags, $depth );
}

function wp_parse_url( string $url ) {
	return parse_url( $url );
}

function sanitize_text_field( $value ): string {
	return trim( strip_tags( (string) $value ) );
}

function sanitize_email( $value ): string {
	return filter_var( (string) $value, FILTER_SANITIZE_EMAIL );
}

function is_email( $value ) {
	return false !== filter_var( (string) $value, FILTER_VALIDATE_EMAIL );
}

function wc_format_decimal( $value, $decimals = false ): string {
	$precision = false === $decimals ? 2 : (int) $decimals;
	return number_format( (float) $value, $precision, '.', '' );
}

final class CACM_Test_Replay_Store {
	private array $nonces = array();

	public function consume( string $nonce, int $expires_at, int $now ) {
		if ( isset( $this->nonces[ $nonce ] ) && $this->nonces[ $nonce ] >= $now ) {
			return false;
		}

		$this->nonces[ $nonce ] = $expires_at;
		return true;
	}
}

final class CACM_Test_Order {
	private int $id;
	private array $meta;

	public function __construct( int $id, array $meta = array() ) {
		$this->id   = $id;
		$this->meta = $meta;
	}

	public function get_id(): int {
		return $this->id;
	}

	public function get_meta( string $key, bool $single = true ) {
		return $this->meta[ $key ] ?? '';
	}
}

final class CACM_Test_Order_Factory {
	public int $created = 0;

	public function create( array $payload, string $session_hash ) {
		++$this->created;
		return new CACM_Test_Order(
			1000 + $this->created,
			array( '_cacm_bridge_session_hash' => $session_hash )
		);
	}
}

final class CACM_Test_Idempotency_Store {
	private array $records = array();
	private array $sources = array();

	public function get( string $session_hash ): ?array {
		return $this->records[ $session_hash ] ?? null;
	}

	public function claim( string $session_hash, string $fingerprint, int $now ): bool {
		if ( isset( $this->records[ $session_hash ] ) ) {
			return false;
		}

		$this->records[ $session_hash ] = array(
			'state'       => 'creating',
			'fingerprint' => $fingerprint,
			'created_at'  => $now,
		);
		return true;
	}

	public function claim_source( string $source_hash, string $session_hash ): bool {
		if ( isset( $this->sources[ $source_hash ] ) && $this->sources[ $source_hash ] !== $session_hash ) {
			return false;
		}
		$this->sources[ $source_hash ] = $session_hash;
		return true;
	}

	public function release_source( string $source_hash, string $session_hash ): void {
		if ( ( $this->sources[ $source_hash ] ?? '' ) === $session_hash ) {
			unset( $this->sources[ $source_hash ] );
		}
	}

	public function complete( string $session_hash, string $fingerprint, int $order_id ): void {
		$this->records[ $session_hash ] = array(
			'state'       => 'complete',
			'fingerprint' => $fingerprint,
			'order_id'    => $order_id,
		);
	}

	public function release( string $session_hash ): void {
		unset( $this->records[ $session_hash ] );
	}
}

/** @var array<int,CACM_Test_Order> $cacm_test_orders */
$cacm_test_orders = array();

function wc_get_order( int $order_id ) {
	global $cacm_test_orders;
	return $cacm_test_orders[ $order_id ] ?? null;
}

function cacm_test_register_order( CACM_Test_Order $order ): void {
	global $cacm_test_orders;
	$cacm_test_orders[ $order->get_id() ] = $order;
}
