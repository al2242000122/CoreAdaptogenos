<?php

defined( 'ABSPATH' ) || exit;

final class CACM_Signature {
	public const WINDOW_SECONDS = 300;

	public static function sign( string $timestamp, string $nonce, string $raw_body, string $secret ): string {
		return hash_hmac( 'sha256', self::canonical_message( $timestamp, $nonce, $raw_body ), $secret );
	}

	public static function sign_response( array $data, string $secret ): string {
		$canonical = implode(
			'|',
			array(
				(string) $data['session'],
				(string) $data['receiver_order_id'],
				(string) $data['amount_minor'],
				(string) $data['currency'],
				(string) $data['environment'],
				(string) $data['checkout_url'],
			)
		);
		return hash_hmac( 'sha256', $canonical, $secret );
	}

	public static function verify(
		string $timestamp,
		string $nonce,
		string $signature,
		string $raw_body,
		string $secret,
		int $now,
		$replay_store
	) {
		if ( strlen( $secret ) < 32 ) {
			return new WP_Error( 'cacm_missing_secret', 'El secreto compartido no está configurado.', array( 'status' => 503 ) );
		}

		if ( ! preg_match( '/^[0-9]{1,12}$/', $timestamp ) ) {
			return new WP_Error( 'cacm_invalid_timestamp', 'La marca de tiempo no es válida.', array( 'status' => 401 ) );
		}

		$timestamp_number = (int) $timestamp;
		if ( abs( $now - $timestamp_number ) > self::WINDOW_SECONDS ) {
			return new WP_Error( 'cacm_expired_timestamp', 'La solicitud está fuera de la ventana permitida.', array( 'status' => 401 ) );
		}

		if ( ! preg_match( '/^[a-f0-9]{32,64}$/', $nonce ) ) {
			return new WP_Error( 'cacm_invalid_nonce', 'El nonce no es válido.', array( 'status' => 401 ) );
		}

		if ( ! preg_match( '/^[a-fA-F0-9]{64}$/', $signature ) ) {
			return new WP_Error( 'cacm_invalid_signature', 'La firma no es válida.', array( 'status' => 401 ) );
		}

		$expected = self::sign( $timestamp, $nonce, $raw_body, $secret );
		if ( ! hash_equals( $expected, strtolower( $signature ) ) ) {
			return new WP_Error( 'cacm_invalid_signature', 'La firma no es válida.', array( 'status' => 401 ) );
		}

		$expires_at = max( $now, $timestamp_number ) + self::WINDOW_SECONDS;
		if ( ! $replay_store->consume( $nonce, $expires_at, $now ) ) {
			return new WP_Error( 'cacm_replayed_nonce', 'El nonce ya fue utilizado.', array( 'status' => 409 ) );
		}

		return true;
	}

	private static function canonical_message( string $timestamp, string $nonce, string $raw_body ): string {
		return $timestamp . "\n" . $nonce . "\n" . $raw_body;
	}
}

final class CACM_WP_Replay_Store {
	private const OPTION_PREFIX = '_cacm_nonce_';

	public function consume( string $nonce, int $expires_at, int $now ): bool {
		$option_name = self::OPTION_PREFIX . hash( 'sha256', $nonce );
		$current     = get_option( $option_name, false );

		if ( false !== $current ) {
			return false;
		}

		$consumed = add_option( $option_name, (string) $expires_at, '', 'no' );
		if ( $consumed && function_exists( 'wp_schedule_single_event' ) ) {
			wp_schedule_single_event( $expires_at + 1, 'cacm_cleanup_nonce', array( $option_name ) );
		}

		return $consumed;
	}

	public static function cleanup( string $option_name ): void {
		if ( 0 === strpos( $option_name, self::OPTION_PREFIX ) ) {
			delete_option( $option_name );
		}
	}
}
