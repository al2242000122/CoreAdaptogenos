<?php

defined( 'ABSPATH' ) || exit;

final class CACM_Gateway_Restriction {
	public static function filter_available_gateways( array $gateways ): array {
		$order_id = absint( get_query_var( 'order-pay' ) );
		if ( ! $order_id && isset( $_GET['order-pay'] ) ) {
			$order_id = absint( wp_unslash( $_GET['order-pay'] ) );
		}

		$order = $order_id ? wc_get_order( $order_id ) : null;
		return self::filter_for_order( $gateways, $order );
	}

	public static function filter_for_order( array $gateways, $order ): array {
		if ( ! $order || '' === (string) $order->get_meta( '_cacm_bridge_session_hash', true ) ) {
			return $gateways;
		}

		if ( time() > (int) $order->get_meta( '_cacm_expires_at', true ) || CACM_Settings::stripe_environment() !== (string) $order->get_meta( '_cacm_environment', true ) ) {
			return array();
		}

		if ( ! isset( $gateways['stripe'] ) || 'stripe' !== (string) ( $gateways['stripe']->id ?? '' ) ) {
			return array();
		}

		return array( 'stripe' => $gateways['stripe'] );
	}

	public static function stripe_is_registered(): bool {
		if ( ! function_exists( 'WC' ) || ! WC() || ! WC()->payment_gateways() ) {
			return false;
		}

		$gateways = WC()->payment_gateways()->payment_gateways();
		$stripe_settings = get_option( 'woocommerce_stripe_settings', array() );
		return isset( $gateways['stripe'] )
			&& 'stripe' === (string) $gateways['stripe']->id
			&& is_array( $stripe_settings )
			&& 'yes' === ( $stripe_settings['enabled'] ?? 'no' );
	}

	public static function filter_return_url( string $return_url, $order ): string {
		if ( ! $order || '' === (string) $order->get_meta( '_cacm_bridge_session_hash', true ) ) {
			return $return_url;
		}

		if ( 'stripe' !== (string) $order->get_payment_method() ) {
			return $return_url;
		}

		$bridge_return = (string) $order->get_meta( '_cacm_return_url', true );
		$origin        = (string) $order->get_meta( '_cacm_origin', true );
		return CACM_Url_Allowlist::is_allowed( $bridge_return, $origin ) ? $bridge_return : $return_url;
	}
}
