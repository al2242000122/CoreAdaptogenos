<?php

defined( 'ABSPATH' ) || exit;

final class CACM_Url_Allowlist {
	public static function is_allowed( string $candidate, string $configured_origin ): bool {
		$candidate_parts = wp_parse_url( $candidate );
		$origin_parts    = wp_parse_url( $configured_origin );

		if ( ! is_array( $candidate_parts ) || ! is_array( $origin_parts ) ) {
			return false;
		}

		if ( 'https' !== strtolower( (string) ( $candidate_parts['scheme'] ?? '' ) ) ) {
			return false;
		}

		if ( 'https' !== strtolower( (string) ( $origin_parts['scheme'] ?? '' ) ) ) {
			return false;
		}

		if ( isset( $candidate_parts['user'] ) || isset( $candidate_parts['pass'] ) ) {
			return false;
		}

		$candidate_host = strtolower( rtrim( (string) ( $candidate_parts['host'] ?? '' ), '.' ) );
		$origin_host    = strtolower( rtrim( (string) ( $origin_parts['host'] ?? '' ), '.' ) );
		if ( '' === $candidate_host || ! hash_equals( $origin_host, $candidate_host ) ) {
			return false;
		}

		return self::effective_port( $candidate_parts ) === self::effective_port( $origin_parts );
	}

	private static function effective_port( array $parts ): int {
		return isset( $parts['port'] ) ? (int) $parts['port'] : 443;
	}
}
