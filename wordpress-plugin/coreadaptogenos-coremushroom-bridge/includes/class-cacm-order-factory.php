<?php

defined( 'ABSPATH' ) || exit;

/** Crea pedidos espejo mediante la capa CRUD de WooCommerce. */
final class CACM_Order_Factory {
	/** @param array<string,mixed> $payload @return WC_Order|WP_Error */
	public function create( array $payload, string $session_hash ) {
		$order = wc_create_order( array( 'status' => 'pending', 'customer_id' => 0, 'created_via' => 'coremushroom_bridge' ) );
		if ( is_wp_error( $order ) ) {
			return $order;
		}
		try {
			$order->set_currency( 'MXN' );
			$this->set_billing( $order, $payload['billing'] );
			foreach ( $payload['items'] as $remote_item ) {
				$item = new WC_Order_Item_Product();
				$item->set_name( $remote_item['name'] );
				$item->set_product_id( 0 );
				$item->set_variation_id( 0 );
				$item->set_quantity( $remote_item['quantity'] );
				$item->set_subtotal( self::minor_to_decimal( $remote_item['subtotal_minor'] ) );
				$item->set_total( self::minor_to_decimal( $remote_item['total_minor'] ) );
				$item->set_subtotal_tax( self::minor_to_decimal( $remote_item['tax_minor'] ) );
				$item->set_total_tax( self::minor_to_decimal( $remote_item['tax_minor'] ) );
				if ( '' !== $remote_item['sku'] ) {
					$item->add_meta_data( '_cacm_source_sku', $remote_item['sku'], true );
				}
				$order->add_item( $item );
			}
			if ( $payload['shipping_minor'] > 0 ) {
				$shipping = new WC_Order_Item_Shipping();
				$shipping->set_method_title( 'Envío y cargos de CoreMushroom' );
				$shipping->set_method_id( 'coremushroom_bridge' );
				$shipping->set_total( self::minor_to_decimal( $payload['shipping_minor'] ) );
				$order->add_item( $shipping );
			}
			if ( 0 !== $payload['adjustments_minor'] ) {
				$adjustment = new WC_Order_Item_Fee();
				$adjustment->set_name( 'Ajustes de CoreMushroom' );
				$adjustment->set_amount( self::minor_to_decimal( $payload['adjustments_minor'] ) );
				$adjustment->set_total( self::minor_to_decimal( $payload['adjustments_minor'] ) );
				$order->add_item( $adjustment );
			}
			$order->update_meta_data( '_cacm_bridge_session_hash', $session_hash );
			// La sesión es opaca y no contiene datos del cliente. Se conserva para
			// devolverla en el callback, pero nunca se usa como llave de búsqueda.
			$order->update_meta_data( '_cacm_session_plain', $payload['session'] );
			$order->update_meta_data( '_cacm_source_order_id', $payload['source_order_id'] );
			$order->update_meta_data( '_cacm_amount_minor', $payload['amount_minor'] );
			$order->update_meta_data( '_cacm_currency', 'MXN' );
			$order->update_meta_data( '_cacm_environment', $payload['environment'] );
			$order->update_meta_data( '_cacm_expires_at', $payload['expires_at'] );
			$order->update_meta_data( '_cacm_callback_url', $payload['callback_url'] );
			$order->update_meta_data( '_cacm_return_url', $payload['return_url'] );
			$order->update_meta_data( '_cacm_origin', CACM_Settings::origin() );
			$order->update_meta_data( '_cacm_payment_only', 'yes' );
			$order->calculate_totals( false );
			$order->set_total( self::minor_to_decimal( $payload['amount_minor'] ) );
			$order->save();
			return $order;
		} catch ( Throwable $error ) {
			$order->delete( true );
			return new WP_Error( 'cacm_order_creation_failed', 'No fue posible crear el pedido receptor.', array( 'status' => 500 ) );
		}
	}

	/** @param WC_Order $order @param array<string,string> $billing */
	private function set_billing( $order, array $billing ): void {
		foreach ( array( 'first_name', 'last_name', 'email', 'phone', 'country', 'state', 'city', 'postcode', 'address_1', 'address_2' ) as $field ) {
			$setter = 'set_billing_' . $field;
			$order->{$setter}( $billing[ $field ] );
		}
	}

	private static function minor_to_decimal( int $minor ): string {
		$sign = $minor < 0 ? '-' : '';
		$absolute = abs( $minor );
		return $sign . sprintf( '%d.%02d', intdiv( $absolute, 100 ), $absolute % 100 );
	}
}
