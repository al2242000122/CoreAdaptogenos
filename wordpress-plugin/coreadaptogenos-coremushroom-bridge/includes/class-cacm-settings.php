<?php

defined( 'ABSPATH' ) || exit;

/** Ajustes privados del puente. El secreto nunca vuelve a imprimirse. */
final class CACM_Settings {
	private const OPTION = 'cacm_bridge_settings';

	public static function get(): array {
		$value = get_option( self::OPTION, array() );
		return is_array( $value ) ? $value : array();
	}

	public static function enabled(): bool {
		$settings = self::get();
		return 'yes' === ( $settings['enabled'] ?? 'no' ) && strlen( self::secret() ) >= 32;
	}

	public static function secret(): string {
		$settings = self::get();
		return (string) ( $settings['secret'] ?? '' );
	}

	public static function origin(): string {
		$settings = self::get();
		return untrailingslashit( (string) ( $settings['origin'] ?? 'https://core.bancodeesporas.com' ) );
	}

	/** Entorno que realmente usa el plugin oficial de Stripe. */
	public static function stripe_environment(): string {
		$settings = get_option( 'woocommerce_stripe_settings', array() );
		return is_array( $settings ) && 'yes' === ( $settings['testmode'] ?? 'no' ) ? 'test' : 'live';
	}

	public static function register_menu(): void {
		add_submenu_page( 'woocommerce', 'Puente CoreMushroom', 'Puente CoreMushroom', 'manage_woocommerce', 'cacm-bridge', array( self::class, 'render_page' ) );
	}

	public static function save(): void {
		if ( ! current_user_can( 'manage_woocommerce' ) ) {
			wp_die( esc_html__( 'No tienes permiso para cambiar esta configuración.', 'cacm-bridge' ) );
		}
		check_admin_referer( 'cacm_save_settings' );
		$current = self::get();
		$origin  = untrailingslashit( esc_url_raw( wp_unslash( $_POST['origin'] ?? '' ) ) );
		$secret  = trim( (string) wp_unslash( $_POST['secret'] ?? '' ) );
		if ( ! CACM_Url_Allowlist::is_allowed( $origin, 'https://core.bancodeesporas.com' ) ) {
			$origin = 'https://core.bancodeesporas.com';
		}
		if ( '' === $secret ) {
			$secret = (string) ( $current['secret'] ?? '' );
		}
		if ( '' !== $secret && strlen( $secret ) < 32 ) {
			add_settings_error( 'cacm_bridge', 'cacm_secret_short', 'El secreto debe tener al menos 32 caracteres.', 'error' );
			$secret = (string) ( $current['secret'] ?? '' );
		}
		update_option( self::OPTION, array( 'enabled' => isset( $_POST['enabled'] ) ? 'yes' : 'no', 'origin' => $origin, 'secret' => $secret ), false );
		add_settings_error( 'cacm_bridge', 'cacm_saved', 'Configuración guardada.', 'updated' );
	}

	public static function render_page(): void {
		if ( isset( $_POST['cacm_save'] ) ) {
			self::save();
		}
		$settings = self::get();
		?>
		<div class="wrap"><h1>Puente de pago CoreMushroom</h1>
		<?php settings_errors( 'cacm_bridge' ); ?>
		<p>Stripe procesa la tarjeta en CoreAdaptógenos. CoreMushroom conserva el pedido y recibe la confirmación firmada.</p>
		<form method="post"><?php wp_nonce_field( 'cacm_save_settings' ); ?>
		<table class="form-table" role="presentation">
		<tr><th scope="row">Activar endpoint</th><td><label><input type="checkbox" name="enabled" value="1" <?php checked( 'yes', $settings['enabled'] ?? 'no' ); ?>> Aceptar sesiones firmadas</label></td></tr>
		<tr><th scope="row"><label for="cacm-origin">Origen permitido</label></th><td><input id="cacm-origin" class="regular-text" type="url" name="origin" value="<?php echo esc_attr( self::origin() ); ?>" required></td></tr>
		<tr><th scope="row"><label for="cacm-secret">Secreto compartido</label></th><td><input id="cacm-secret" class="regular-text" type="password" name="secret" value="" autocomplete="new-password"><p class="description"><?php echo '' !== self::secret() ? 'Ya existe un secreto. Déjalo vacío para conservarlo.' : 'Mínimo 32 caracteres. Debe coincidir con CoreMushroom.'; ?></p></td></tr>
		</table><?php submit_button( 'Guardar', 'primary', 'cacm_save' ); ?></form></div>
		<?php
	}
}
