# QR del POS en el VPS

La imagen se guarda en `data/payment-qr/payment-qr.image` dentro del proyecto por defecto. La imagen y su ruta no se guardan en Supabase. La API usa Supabase solamente para validar la sesión y el rol administrador.

Para conservar el QR entre despliegues configura `PAYMENT_QR_DIR=/var/lib/picla/payment-qr` en el proceso de Next.js. Crea esa carpeta y dale permisos de lectura y escritura al usuario de la aplicación. Con Docker monta un volumen persistente en esa ruta. Reinicia al cambiar la variable.

Requiere Node.js con disco persistente y las variables de autenticación existentes (incluida `SUPABASE_SERVICE_ROLE_KEY`). En varias instancias usa una carpeta compartida.

En Configuración, un administrador puede subir, reemplazar o quitar un PNG, JPG o WebP de hasta 2 MB. Al pulsar Cobrar en el carrito y seleccionar QR/Transferencia se muestra la imagen. También se muestra para pagos iniciales de créditos por QR.
