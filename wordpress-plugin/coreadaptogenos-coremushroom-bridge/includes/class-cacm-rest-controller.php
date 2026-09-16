<?php

defined( 'ABSPATH' ) || exit;

/** Endpoint privado que crea sesiones de pago. */
final class CACM_REST_Controller {
	private $replay_store;
	private $order_service;

	public function __construct() {
		$this->replay_store  = new CACM_WP_Replay_Store();
		$this->order_service = new CACM_Order_Service( new CACM_Order_Factory(), new CACM_WP_Idempotency_Store() );
	}

	public function register_routes(): void {
		register_rest_route( 'coreadaptogenos/v1', '/payment-sessions', array( 'methods' => 'POST', 'callback' => array( $this, 'create_session' ), 'permission_callback' => array( $this, 'authorize' ) ) );
	}

	public function authorize( $request ) {
		if ( ! CACM_Settings::enabled() ) {
			return new WP_Error( 'cacm_disabled', 'El puente no está habilitado.', array( 'status' => 503 ) );
		}
		return CACM_Signature::verify(
			(string) $request->get_header( 'x-cm-timestamp' ),
			(string) $request->get_header( 'x-cm-nonce' ),
			(string) $request->get_header( 'x-cm-signature' ),
			$request->get_body(),
			CACM_Settings::secret(),
			time(),
			$this->replay_store
		);
	}

	public function create_session( $request ) {
		$payload = $request->get_json_params();
		if ( ! is_array( $payload ) ) {
			return new WP_Error( 'cacm_invalid_json', 'El cuerpo JSON no es válido.', array( 'status' => 400 ) );
		}
		$payload = CACM_Session_Validator::validate( $payload, CACM_Settings::origin(), time() );
		if ( is_wp_error( $payload ) ) {
			return $payload;
		}
		if ( ! CACM_Gateway_Restriction::stripe_is_registered() ) {
			return new WP_Error( 'cacm_stripe_unavailable', 'Stripe no está disponible en el receptor.', array( 'status' => 503 ) );
		}
		$result = $this->order_service->create_or_get( $payload );
		if ( is_wp_error( $result ) ) {
			return $result;
		}
		$order = $result['order'];
		$data  = array(
			'session'           => $payload['session'],
			'receiver_order_id' => (int) $order->get_id(),
			'amount_minor'      => $payload['amount_minor'],
			'currency'          => 'MXN',
			'environment'       => $payload['environment'],
			'checkout_url'      => $order->get_checkout_payment_url(),
		);
		$data['signature'] = CACM_Signature::sign_response( $data, CACM_Settings::secret() );
		$response = new WP_REST_Response( $data, 201 );
		$response->header( 'Cache-Control', 'no-store, private' );
		$response->header( 'Referrer-Policy', 'no-referrer' );
		return $response;
	}
}
