<?php
/**
 * Plugin Name: CoreAdaptógenos · Puente CoreMushroom
 * Description: Recibe pedidos de CoreMushroom y los cobra con Stripe mediante WooCommerce.
 * Version: 0.2.1
 * Requires at least: 6.7
 * Requires PHP: 8.1
 * Requires Plugins: woocommerce, woocommerce-gateway-stripe
 * Author: CoreAdaptógenos
 * Text Domain: cacm-bridge
 */

defined( 'ABSPATH' ) || exit;

define( 'CACM_BRIDGE_VERSION', '0.2.1' );

$cacm_files = array(
	'includes/class-cacm-signature.php',
	'includes/class-cacm-url-allowlist.php',
	'includes/class-cacm-session-validator.php',
	'includes/class-cacm-order-service.php',
	'includes/class-cacm-gateway-restriction.php',
	'includes/class-cacm-settings.php',
	'includes/class-cacm-order-factory.php',
	'includes/class-cacm-rest-controller.php',
	'includes/class-cacm-callback.php',
);
foreach ( $cacm_files as $cacm_file ) {
	require_once __DIR__ . '/' . $cacm_file;
}

add_action(
	'before_woocommerce_init',
	static function (): void {
		if ( class_exists( Automattic\WooCommerce\Utilities\FeaturesUtil::class ) ) {
			Automattic\WooCommerce\Utilities\FeaturesUtil::declare_compatibility( 'custom_order_tables', __FILE__, true );
		}
	}
);

add_action( 'admin_menu', array( CACM_Settings::class, 'register_menu' ) );
add_action( 'cacm_cleanup_nonce', array( CACM_WP_Replay_Store::class, 'cleanup' ) );
add_action( 'cacm_retry_bridge_callback', array( CACM_Callback::class, 'retry' ), 10, 2 );
add_action( 'woocommerce_payment_complete', array( CACM_Callback::class, 'payment_complete' ), 20, 2 );
add_action( 'woocommerce_order_refunded', array( CACM_Callback::class, 'order_refunded' ), 20, 2 );
add_action( 'woocommerce_order_status_changed', array( CACM_Callback::class, 'status_changed' ), 20, 4 );
add_filter( 'woocommerce_available_payment_gateways', array( CACM_Gateway_Restriction::class, 'filter_available_gateways' ), 100 );
add_filter( 'woocommerce_get_return_url', array( CACM_Gateway_Restriction::class, 'filter_return_url' ), 20, 2 );
add_filter( 'woocommerce_payment_complete_order_status', array( CACM_Callback::class, 'processing_status' ), 20, 3 );
add_filter( 'woocommerce_can_reduce_order_stock', array( CACM_Callback::class, 'prevent_stock_reduction' ), 20, 2 );

foreach ( array( 'processing', 'completed', 'on_hold', 'failed' ) as $cacm_email_status ) {
	add_filter( 'woocommerce_email_enabled_customer_' . $cacm_email_status . '_order', array( CACM_Callback::class, 'suppress_customer_email' ), 20, 2 );
}

add_action(
	'rest_api_init',
	static function (): void {
		$controller = new CACM_REST_Controller();
		$controller->register_routes();
	}
);

add_action(
	'admin_notices',
	static function (): void {
		if ( current_user_can( 'manage_woocommerce' ) && ! CACM_Settings::enabled() ) {
			echo '<div class="notice notice-warning"><p>El puente CoreMushroom está instalado pero permanece cerrado hasta configurar su secreto en WooCommerce → Puente CoreMushroom.</p></div>';
		}
	}
);
