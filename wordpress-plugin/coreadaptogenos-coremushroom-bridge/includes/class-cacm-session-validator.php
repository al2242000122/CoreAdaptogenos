<?php

defined( 'ABSPATH' ) || exit;

final class CACM_Session_Validator {
	private const MAX_ITEMS = 100;

	public static function validate( array $payload, string $configured_origin, int $now ) {
		if ( '1' !== ( $payload['protocol'] ?? '' ) ) {
			return self::error( 'cacm_invalid_protocol', 'La versión del protocolo no es válida.' );
		}

		$session = (string) ( $payload['session'] ?? '' );
		if ( ! preg_match( '/^[a-f0-9]{64}$/', $session ) ) {
			return self::error( 'cacm_invalid_session', 'El identificador de sesión no es válido.' );
		}

		$source_order_id = sanitize_text_field( (string) ( $payload['source_order_id'] ?? '' ) );
		if ( ! preg_match( '/^[1-9][0-9]{0,19}$/', $source_order_id ) ) {
			return self::error( 'cacm_invalid_source_order', 'La referencia del pedido de origen no es válida.' );
		}

		if ( ! isset( $payload['amount_minor'] ) || ! is_int( $payload['amount_minor'] ) || $payload['amount_minor'] <= 0 ) {
			return self::error( 'cacm_invalid_amount', 'El importe debe ser un entero positivo en centavos.' );
		}

		if ( 'MXN' !== ( $payload['currency'] ?? '' ) ) {
			return self::error( 'cacm_invalid_currency', 'La moneda permitida es MXN.' );
		}

		if ( 'card' !== ( $payload['method'] ?? '' ) ) {
			return self::error( 'cacm_invalid_method', 'El único método permitido para el puente es card.' );
		}

		$environment = (string) ( $payload['environment'] ?? '' );
		if ( ! in_array( $environment, array( 'test', 'live' ), true ) || CACM_Settings::stripe_environment() !== $environment ) {
			return self::error( 'cacm_invalid_environment', 'El entorno solicitado no coincide con Stripe.' );
		}

		$expires_at = $payload['expires_at'] ?? null;
		if ( ! is_int( $expires_at ) || $expires_at <= $now || $expires_at > $now + ( 2 * HOUR_IN_SECONDS ) ) {
			return self::error( 'cacm_invalid_expiration', 'La vigencia de la sesión no es válida.' );
		}

		$shipping_minor = $payload['shipping_minor'] ?? null;
		if ( ! is_int( $shipping_minor ) || $shipping_minor < 0 ) {
			return self::error( 'cacm_invalid_shipping', 'El envío debe ser un entero no negativo en centavos.' );
		}
		$adjustments_minor = $payload['adjustments_minor'] ?? null;
		if ( ! is_int( $adjustments_minor ) ) {
			return self::error( 'cacm_invalid_adjustments', 'Los ajustes deben expresarse como un entero en centavos.' );
		}

		$return_url   = (string) ( $payload['return_url'] ?? '' );
		$callback_url = (string) ( $payload['callback_url'] ?? '' );
		if ( ! CACM_Url_Allowlist::is_allowed( $return_url, $configured_origin ) ) {
			return self::error( 'cacm_invalid_return_url', 'La URL de retorno no pertenece al origen permitido.' );
		}

		if ( ! CACM_Url_Allowlist::is_allowed( $callback_url, $configured_origin ) ) {
			return self::error( 'cacm_invalid_callback_url', 'La URL de callback no pertenece al origen permitido.' );
		}

		$billing = self::normalize_billing( $payload['billing'] ?? null );
		if ( is_wp_error( $billing ) ) {
			return $billing;
		}

		$items = $payload['items'] ?? null;
		if ( ! is_array( $items ) || array() === $items || count( $items ) > self::MAX_ITEMS ) {
			return self::error( 'cacm_invalid_items', 'La sesión debe incluir entre uno y cien artículos.' );
		}

		$normalized_items = array();
		$items_total      = 0;
		foreach ( $items as $item ) {
			$normalized = self::normalize_item( $item );
			if ( is_wp_error( $normalized ) ) {
				return $normalized;
			}
			$items_total += $normalized['total_minor'] + $normalized['tax_minor'];
			$normalized_items[] = $normalized;
		}

		if ( $items_total + $shipping_minor + $adjustments_minor !== $payload['amount_minor'] ) {
			return self::error( 'cacm_amount_mismatch', 'La suma de artículos, impuestos y envío no coincide con el importe del pedido.' );
		}

		return array(
			'protocol'        => '1',
			'session'         => $session,
			'source_order_id' => $source_order_id,
			'amount_minor'    => $payload['amount_minor'],
			'currency'        => 'MXN',
			'method'          => 'card',
			'environment'     => $environment,
			'expires_at'      => $expires_at,
			'items'           => $normalized_items,
			'shipping_minor'  => $shipping_minor,
			'adjustments_minor' => $adjustments_minor,
			'billing'         => $billing,
			'callback_url'    => $callback_url,
			'return_url'      => $return_url,
		);
	}

	private static function normalize_item( $item ) {
		if ( ! is_array( $item ) ) {
			return self::error( 'cacm_invalid_item', 'Cada artículo debe ser un objeto.' );
		}

		$name           = sanitize_text_field( (string) ( $item['name'] ?? '' ) );
		$sku            = sanitize_text_field( (string) ( $item['sku'] ?? '' ) );
		$quantity       = $item['quantity'] ?? null;
		$subtotal_minor = $item['subtotal_minor'] ?? null;
		$total_minor    = $item['total_minor'] ?? null;
		$tax_minor      = $item['tax_minor'] ?? null;

		if ( '' === $name || strlen( $name ) > 200 || strlen( $sku ) > 100 ) {
			return self::error( 'cacm_invalid_item_name', 'El nombre o SKU de un artículo no es válido.' );
		}
		if ( ! is_int( $quantity ) || $quantity < 1 || $quantity > 999 ) {
			return self::error( 'cacm_invalid_item_quantity', 'La cantidad de un artículo no es válida.' );
		}
		if ( ! is_int( $subtotal_minor ) || ! is_int( $total_minor ) || ! is_int( $tax_minor ) || $subtotal_minor < 0 || $total_minor < 0 || $tax_minor < 0 ) {
			return self::error( 'cacm_invalid_item_total', 'Los importes de un artículo no son válidos.' );
		}
		if ( $subtotal_minor < $total_minor ) {
			return self::error( 'cacm_invalid_item_total', 'El subtotal no puede ser menor que el total del artículo.' );
		}

		return array(
			'name'           => $name,
			'sku'            => $sku,
			'quantity'       => $quantity,
			'subtotal_minor' => $subtotal_minor,
			'total_minor'    => $total_minor,
			'tax_minor'      => $tax_minor,
		);
	}

	private static function normalize_billing( $billing ) {
		if ( ! is_array( $billing ) ) {
			return self::error( 'cacm_invalid_billing', 'Los datos de facturación no son válidos.' );
		}

		$normalized = array();
		foreach ( array( 'first_name', 'last_name', 'phone', 'country', 'state', 'city', 'postcode', 'address_1', 'address_2' ) as $field ) {
			$normalized[ $field ] = sanitize_text_field( (string) ( $billing[ $field ] ?? '' ) );
		}
		$normalized['email'] = sanitize_email( (string) ( $billing['email'] ?? '' ) );

		if ( '' === $normalized['first_name'] || '' === $normalized['last_name'] || ! is_email( $normalized['email'] ) || 'MX' !== $normalized['country'] ) {
			return self::error( 'cacm_invalid_billing', 'Nombre, correo y país MX son obligatorios.' );
		}

		return $normalized;
	}

	private static function error( string $code, string $message ): WP_Error {
		return new WP_Error( $code, $message, array( 'status' => 400 ) );
	}
}
