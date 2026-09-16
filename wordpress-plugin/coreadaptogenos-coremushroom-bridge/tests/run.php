<?php

declare(strict_types=1);

require __DIR__ . '/bootstrap.php';

$includes = array(
	__DIR__ . '/../includes/class-cacm-signature.php',
	__DIR__ . '/../includes/class-cacm-url-allowlist.php',
	__DIR__ . '/../includes/class-cacm-session-validator.php',
	__DIR__ . '/../includes/class-cacm-order-service.php',
	__DIR__ . '/../includes/class-cacm-gateway-restriction.php',
);

foreach ( $includes as $include ) {
	if ( is_file( $include ) ) {
		require_once $include;
	}
}

$tests = array();

function cacm_test( string $name, callable $test ): void {
	global $tests;
	$tests[ $name ] = $test;
}

function cacm_assert_true( $condition, string $message = 'Se esperaba verdadero.' ): void {
	if ( true !== $condition ) {
		throw new RuntimeException( $message );
	}
}

function cacm_assert_same( $expected, $actual, string $message = '' ): void {
	if ( $expected !== $actual ) {
		$detail = sprintf(
			'Se esperaba %s y se obtuvo %s.',
			var_export( $expected, true ),
			var_export( $actual, true )
		);
		throw new RuntimeException( '' !== $message ? $message . ' ' . $detail : $detail );
	}
}

cacm_test(
	'rechaza una firma HMAC inválida',
	static function (): void {
		$store  = new CACM_Test_Replay_Store();
		$result = CACM_Signature::verify(
			'2000000000',
			str_repeat( 'a', 32 ),
			str_repeat( '0', 64 ),
			'{"session_id":"abc"}',
			'secreto-de-prueba-con-entropia-1234',
			2000000000,
			$store
		);

		cacm_assert_true( is_wp_error( $result ) );
		cacm_assert_same( 'cacm_invalid_signature', $result->get_error_code() );
	}
);

cacm_test(
	'rechaza una marca de tiempo fuera de la ventana de 300 segundos',
	static function (): void {
		$store     = new CACM_Test_Replay_Store();
		$body      = '{"session_id":"abc"}';
		$timestamp = '1999999699';
		$nonce     = str_repeat( 'b', 32 );
		$secret    = 'secreto-de-prueba-con-entropia-1234';
		$signature = CACM_Signature::sign( $timestamp, $nonce, $body, $secret );
		$result    = CACM_Signature::verify(
			$timestamp,
			$nonce,
			$signature,
			$body,
			$secret,
			2000000000,
			$store
		);

		cacm_assert_true( is_wp_error( $result ) );
		cacm_assert_same( 'cacm_expired_timestamp', $result->get_error_code() );
	}
);

cacm_test(
	'rechaza el replay de un nonce válido',
	static function (): void {
		$store     = new CACM_Test_Replay_Store();
		$body      = '{"session_id":"abc"}';
		$timestamp = '2000000000';
		$nonce     = str_repeat( 'c', 32 );
		$secret    = 'secreto-de-prueba-con-entropia-1234';
		$signature = CACM_Signature::sign( $timestamp, $nonce, $body, $secret );

		cacm_assert_true(
			CACM_Signature::verify( $timestamp, $nonce, $signature, $body, $secret, 2000000000, $store )
		);
		$replay = CACM_Signature::verify( $timestamp, $nonce, $signature, $body, $secret, 2000000000, $store );
		cacm_assert_true( is_wp_error( $replay ) );
		cacm_assert_same( 'cacm_replayed_nonce', $replay->get_error_code() );
	}
);

cacm_test(
	'reutiliza el pedido para la misma sesión y el mismo contenido',
	static function (): void {
		$factory = new CACM_Test_Order_Factory();
		$store   = new CACM_Test_Idempotency_Store();
		$service = new CACM_Order_Service( $factory, $store, static fn (): int => 2000000000 );
		$payload = array(
			'protocol'        => '1',
			'session'         => str_repeat( 'a', 64 ),
			'source_order_id' => '42',
			'amount_minor'    => 90000,
			'currency'        => 'MXN',
			'method'          => 'card',
			'items'           => array(
				array( 'name' => 'Cordyceps · Microdosis 30 cápsulas', 'quantity' => 2, 'total_minor' => 90000 ),
			),
		);

		$first = $service->create_or_get( $payload );
		cacm_test_register_order( $first['order'] );
		$second = $service->create_or_get( $payload );

		cacm_assert_same( 1, $factory->created );
		cacm_assert_same( $first['order']->get_id(), $second['order']->get_id() );
		cacm_assert_same( false, $second['created'] );
	}
);

cacm_test(
	'rechaza reutilizar una sesión con un importe distinto',
	static function (): void {
		$factory = new CACM_Test_Order_Factory();
		$store   = new CACM_Test_Idempotency_Store();
		$service = new CACM_Order_Service( $factory, $store, static fn (): int => 2000000000 );
		$payload = array(
			'protocol'        => '1',
			'session'         => str_repeat( 'b', 64 ),
			'source_order_id' => '43',
			'amount_minor'    => 90000,
			'currency'        => 'MXN',
			'method'          => 'card',
			'items'           => array( array( 'name' => 'Tisana de Ganoderma', 'quantity' => 1, 'total_minor' => 90000 ) ),
		);
		$first = $service->create_or_get( $payload );
		cacm_test_register_order( $first['order'] );
		$payload['amount_minor'] = 91000;
		$result = $service->create_or_get( $payload );

		cacm_assert_true( is_wp_error( $result ) );
		cacm_assert_same( 'cacm_session_conflict', $result->get_error_code() );
	}
);

cacm_test(
	'rechaza otra sesión para el mismo pedido de origen',
	static function (): void {
		$factory = new CACM_Test_Order_Factory();
		$store   = new CACM_Test_Idempotency_Store();
		$service = new CACM_Order_Service( $factory, $store, static fn (): int => 2000000000 );
		$payload = array( 'session' => str_repeat( '1', 64 ), 'source_order_id' => '44', 'amount_minor' => 90000 );
		$first   = $service->create_or_get( $payload );
		cacm_test_register_order( $first['order'] );
		$payload['session'] = str_repeat( '2', 64 );
		$result = $service->create_or_get( $payload );
		cacm_assert_true( is_wp_error( $result ) );
		cacm_assert_same( 'cacm_source_order_conflict', $result->get_error_code() );
	}
);

cacm_test(
	'permite una URL HTTPS del origen configurado',
	static function (): void {
		cacm_assert_true(
			CACM_Url_Allowlist::is_allowed(
				'https://core.bancodeesporas.com/finalizar-compra/order-received/42?key=wc_abc',
				'https://core.bancodeesporas.com'
			)
		);
	}
);

cacm_test(
	'rechaza subdominios engañosos y protocolos inseguros',
	static function (): void {
		cacm_assert_same(
			false,
			CACM_Url_Allowlist::is_allowed(
				'https://core.bancodeesporas.com.evil.test/retorno',
				'https://core.bancodeesporas.com'
			)
		);
		cacm_assert_same(
			false,
			CACM_Url_Allowlist::is_allowed(
				'http://core.bancodeesporas.com/retorno',
				'https://core.bancodeesporas.com'
			)
		);
	}
);

cacm_test(
	'deja únicamente el gateway oficial stripe en pedidos puente',
	static function (): void {
		$order    = new CACM_Test_Order( 77, array( '_cacm_bridge_session_hash' => hash( 'sha256', 'sesion' ), '_cacm_expires_at' => time() + 600, '_cacm_environment' => 'test' ) );
		$gateways = array(
			'cod'    => (object) array( 'id' => 'cod' ),
			'stripe' => (object) array( 'id' => 'stripe' ),
			'bacs'   => (object) array( 'id' => 'bacs' ),
		);
		$result = CACM_Gateway_Restriction::filter_for_order( $gateways, $order );

		cacm_assert_same( array( 'stripe' ), array_keys( $result ) );
	}
);

cacm_test(
	'valida artículos transparentes cuyo total coincide exactamente',
	static function (): void {
		$payload = array(
			'protocol'        => '1',
			'session'         => str_repeat( 'd', 64 ),
			'source_order_id' => '99',
			'amount_minor'    => 90000,
			'currency'        => 'MXN',
			'method'          => 'card',
			'environment'     => 'test',
			'expires_at'      => 2000003600,
			'shipping_minor'  => 1000,
			'adjustments_minor' => 0,
			'billing'         => array(
				'first_name' => 'Ana', 'last_name' => 'López', 'email' => 'ana@example.test',
				'phone' => '5555555555', 'country' => 'MX', 'state' => 'CMX', 'city' => 'Ciudad de México',
				'postcode' => '01000', 'address_1' => 'Calle Uno 10', 'address_2' => '',
			),
			'return_url'      => 'https://core.bancodeesporas.com/finalizar-compra/order-received/99',
			'callback_url'    => 'https://core.bancodeesporas.com/wp-json/coremushroom/v1/payment-events',
			'items'           => array(
				array( 'name' => 'Chocolate de Hericium', 'sku' => 'HER-CHO', 'quantity' => 1, 'subtotal_minor' => 50000, 'total_minor' => 49000, 'tax_minor' => 0 ),
				array( 'name' => 'Tisana de Ganoderma', 'sku' => 'GAN-TIS', 'quantity' => 2, 'subtotal_minor' => 40000, 'total_minor' => 40000, 'tax_minor' => 0 ),
			),
		);
		$result = CACM_Session_Validator::validate( $payload, 'https://core.bancodeesporas.com', 2000000000 );

		cacm_assert_true( is_array( $result ) );
		cacm_assert_same( 90000, $result['amount_minor'] );
		cacm_assert_same( 'Chocolate de Hericium', $result['items'][0]['name'] );
	}
);

cacm_test(
	'rechaza artículos cuyo total no coincide con el pedido',
	static function (): void {
		$payload = array(
			'protocol'        => '1',
			'session'         => str_repeat( 'e', 64 ),
			'source_order_id' => '100',
			'amount_minor'    => 90000,
			'currency'        => 'MXN',
			'method'          => 'card',
			'environment'     => 'test',
			'expires_at'      => 2000003600,
			'shipping_minor'  => 0,
			'adjustments_minor' => 0,
			'billing'         => array( 'first_name' => 'Ana', 'last_name' => 'López', 'email' => 'ana@example.test', 'phone' => '', 'country' => 'MX', 'state' => '', 'city' => '', 'postcode' => '', 'address_1' => '', 'address_2' => '' ),
			'return_url'      => 'https://core.bancodeesporas.com/pago/resultado',
			'callback_url'    => 'https://core.bancodeesporas.com/wp-json/coremushroom/v1/payment-events',
			'items'           => array(
				array( 'name' => 'Chocolate de Hericium', 'sku' => '', 'quantity' => 1, 'subtotal_minor' => 89999, 'total_minor' => 89999, 'tax_minor' => 0 ),
			),
		);
		$result = CACM_Session_Validator::validate( $payload, 'https://core.bancodeesporas.com', 2000000000 );

		cacm_assert_true( is_wp_error( $result ) );
		cacm_assert_same( 'cacm_amount_mismatch', $result->get_error_code() );
	}
);

cacm_test(
	'acepta un ajuste negativo firmado sin alterar el total',
	static function (): void {
		$payload = array(
			'protocol' => '1', 'session' => str_repeat( '3', 64 ), 'source_order_id' => '101',
			'amount_minor' => 90000, 'currency' => 'MXN', 'method' => 'card',
			'environment' => 'test', 'expires_at' => 2000003600,
			'shipping_minor' => 0, 'adjustments_minor' => -10000,
			'billing' => array( 'first_name' => 'Ana', 'last_name' => 'López', 'email' => 'ana@example.test', 'country' => 'MX' ),
			'return_url' => 'https://core.bancodeesporas.com/finalizar-compra/order-received/101',
			'callback_url' => 'https://core.bancodeesporas.com/wp-json/coremushroom/v1/payment-events',
			'items' => array( array( 'name' => 'Chocolate de Hericium', 'sku' => '', 'quantity' => 1, 'subtotal_minor' => 100000, 'total_minor' => 100000, 'tax_minor' => 0 ) ),
		);
		$result = CACM_Session_Validator::validate( $payload, 'https://core.bancodeesporas.com', 2000000000 );
		cacm_assert_true( is_array( $result ) );
		cacm_assert_same( -10000, $result['adjustments_minor'] );
	}
);

cacm_test(
	'usa el retorno permitido para un pedido puente de Stripe',
	static function (): void {
		$order = new class() {
			public function get_meta( string $key, bool $single = true ) {
				$meta = array(
					'_cacm_bridge_session_hash' => hash( 'sha256', 'sesion' ),
					'_cacm_return_url'          => 'https://core.bancodeesporas.com/pago/resultado',
					'_cacm_origin'              => 'https://core.bancodeesporas.com',
				);
				return $meta[ $key ] ?? '';
			}
			public function get_payment_method(): string {
				return 'stripe';
			}
		};

		cacm_assert_same(
			'https://core.bancodeesporas.com/pago/resultado',
			CACM_Gateway_Restriction::filter_return_url( 'https://receiver.example/order-received', $order )
		);
	}
);

cacm_test(
	'firma la respuesta con el canon separado por barras verticales',
	static function (): void {
		$data = array(
			'session'          => str_repeat( 'f', 64 ),
			'receiver_order_id' => 87,
			'amount_minor'      => 90000,
			'currency'          => 'MXN',
			'environment'       => 'test',
			'checkout_url'      => 'https://coreadaptogenos.app/finalizar-compra/order-pay/87/?pay_for_order=true&key=wc_test',
		);
		$expected = hash_hmac(
			'sha256',
			implode( '|', array_values( $data ) ),
			'secreto-de-prueba-con-entropia-1234'
		);

		cacm_assert_same( $expected, CACM_Signature::sign_response( $data, 'secreto-de-prueba-con-entropia-1234' ) );
	}
);

$failed = 0;
foreach ( $tests as $name => $test ) {
	try {
		$test();
		fwrite( STDOUT, "OK  {$name}\n" );
	} catch ( Throwable $error ) {
		++$failed;
		fwrite( STDERR, "FAIL {$name}: {$error->getMessage()}\n" );
	}
}

fwrite( STDOUT, sprintf( "\n%d pruebas, %d fallos.\n", count( $tests ), $failed ) );
exit( 0 === $failed ? 0 : 1 );
