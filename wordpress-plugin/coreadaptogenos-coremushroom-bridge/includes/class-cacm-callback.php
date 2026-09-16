<?php

defined( 'ABSPATH' ) || exit;

/** Entrega a CoreMushroom eventos confirmados por WooCommerce y Stripe. */
final class CACM_Callback {
	private const MAX_ATTEMPTS = 6;

	public static function payment_complete( $order_id, $transaction_id = '' ): void {
		$order = wc_get_order( $order_id );
		if ( self::is_bridge_order( $order ) ) {
			self::queue_event( $order, 'paid', array( 'transaction_id' => (string) $transaction_id ), 'paid|' . (string) $transaction_id );
		}
	}

	public static function order_refunded( $order_id, $refund_id ): void {
		$order  = wc_get_order( $order_id );
		$refund = wc_get_order( $refund_id );
		if ( ! self::is_bridge_order( $order ) || ! $refund || ! method_exists( $refund, 'get_amount' ) ) {
			return;
		}
		self::queue_event(
			$order,
			'refunded',
			array(
				'transaction_id'      => (string) $order->get_transaction_id(),
				'refund_amount_minor' => (int) round( (float) $refund->get_amount() * 100 ),
			),
			'refunded|' . (string) $refund_id
		);
	}

	public static function status_changed( $order_id, $from, $to, $order ): void {
		unset( $order_id );
		if ( self::is_bridge_order( $order ) && in_array( $from, array( 'processing', 'completed' ), true ) && in_array( $to, array( 'failed', 'cancelled' ), true ) ) {
			self::queue_event( $order, 'payment_reversed', array( 'transaction_id' => (string) $order->get_transaction_id() ), 'payment_reversed|' . $from . '|' . $to );
		}
	}

	private static function queue_event( $order, string $event, array $extra, string $seed ): void {
		$session = (string) $order->get_meta( '_cacm_session_plain', true );
		if ( '' === $session ) {
			return;
		}
		$event_id = hash( 'sha256', $event . '|' . $order->get_id() . '|' . $seed );
		$payload  = array_merge(
			array(
				'event'             => $event,
				'event_id'          => $event_id,
				'source_order_id'   => (string) $order->get_meta( '_cacm_source_order_id', true ),
				'session'           => $session,
				'receiver_order_id' => (int) $order->get_id(),
				'amount_minor'      => (int) $order->get_meta( '_cacm_amount_minor', true ),
				'currency'          => (string) $order->get_meta( '_cacm_currency', true ),
				'environment'       => (string) $order->get_meta( '_cacm_environment', true ),
			),
			$extra
		);
		$order->update_meta_data( '_cacm_event_payload_' . $event_id, $payload );
		$order->save();
		self::deliver( $order, $payload );
	}

	public static function retry( $order_id, $event_id = '' ): void {
		$order   = wc_get_order( $order_id );
		$payload = $order && preg_match( '/^[a-f0-9]{64}$/', (string) $event_id )
			? $order->get_meta( '_cacm_event_payload_' . $event_id, true )
			: null;
		if ( self::is_bridge_order( $order ) && is_array( $payload ) ) {
			self::deliver( $order, $payload );
		}
	}

	private static function deliver( $order, array $payload ): void {
		$event_id = (string) $payload['event_id'];
		if ( 'yes' === $order->get_meta( '_cacm_callback_delivered_' . $event_id, true ) ) {
			return;
		}
		$body      = wp_json_encode( $payload );
		$timestamp = (string) time();
		$nonce     = bin2hex( random_bytes( 16 ) );
		$response  = wp_safe_remote_post(
			(string) $order->get_meta( '_cacm_callback_url', true ),
			array(
				'timeout'     => 20,
				'redirection' => 0,
				'headers'     => array(
					'Content-Type'   => 'application/json',
					'X-CA-Timestamp' => $timestamp,
					'X-CA-Nonce'     => $nonce,
					'X-CA-Signature' => CACM_Signature::sign( $timestamp, $nonce, $body, CACM_Settings::secret() ),
				),
				'body' => $body,
			)
		);
		$code = is_wp_error( $response ) ? 0 : wp_remote_retrieve_response_code( $response );
		$ack  = is_wp_error( $response ) ? null : json_decode( wp_remote_retrieve_body( $response ), true );
		$delivered = $code >= 200 && $code < 300 && is_array( $ack )
			&& true === ( $ack['ok'] ?? false )
			&& hash_equals( $event_id, (string) ( $ack['event_id'] ?? '' ) )
			&& (string) $payload['source_order_id'] === (string) ( $ack['source_order_id'] ?? '' )
			&& (int) $order->get_id() === (int) ( $ack['receiver_order_id'] ?? 0 );
		if ( $delivered ) {
			$order->update_meta_data( '_cacm_callback_delivered_' . $event_id, 'yes' );
			$order->delete_meta_data( '_cacm_event_payload_' . $event_id );
			$order->save();
			return;
		}
		self::schedule_retry( $order, $event_id );
	}

	private static function schedule_retry( $order, string $event_id ): void {
		$key     = '_cacm_callback_attempts_' . $event_id;
		$attempt = (int) $order->get_meta( $key, true ) + 1;
		$order->update_meta_data( $key, $attempt );
		$order->save();
		if ( $attempt >= self::MAX_ATTEMPTS ) {
			$order->add_order_note( 'No fue posible notificar el evento ' . $event_id . ' a CoreMushroom después de seis intentos.' );
			return;
		}
		$when = time() + min( HOUR_IN_SECONDS, 60 * ( 2 ** ( $attempt - 1 ) ) );
		$args = array( (int) $order->get_id(), $event_id );
		if ( function_exists( 'as_schedule_single_action' ) ) {
			as_schedule_single_action( $when, 'cacm_retry_bridge_callback', $args, 'cacm-bridge' );
		} else {
			wp_schedule_single_event( $when, 'cacm_retry_bridge_callback', $args );
		}
	}

	public static function processing_status( $status, $order_id, $order ) {
		unset( $order_id );
		return self::is_bridge_order( $order ) ? 'processing' : $status;
	}

	public static function prevent_stock_reduction( $can_reduce, $order ): bool {
		return self::is_bridge_order( $order ) ? false : (bool) $can_reduce;
	}

	public static function suppress_customer_email( $enabled, $order ): bool {
		return self::is_bridge_order( $order ) ? false : (bool) $enabled;
	}

	private static function is_bridge_order( $order ): bool {
		return $order && '' !== (string) $order->get_meta( '_cacm_bridge_session_hash', true );
	}
}
