import Swal from 'sweetalert2'

interface ConfirmAlertOptions {
  title?: string
  text: string
  confirmButtonText?: string
  cancelButtonText?: string
}

const BASE_OPTIONS = {
  background: '#0f172a',
  color: '#e2e8f0',
  confirmButtonColor: '#2563eb',
  cancelButtonColor: '#475569',
}

export async function showErrorAlert(message: string, title = 'No se pudo completar la accion') {
  await Swal.fire({
    ...BASE_OPTIONS,
    icon: 'error',
    title,
    text: message,
    confirmButtonText: 'Entendido',
  })
}

export async function showConfirmAlert(options: ConfirmAlertOptions) {
  const result = await Swal.fire({
    ...BASE_OPTIONS,
    icon: 'warning',
    title: options.title ?? 'Confirmar accion',
    text: options.text,
    showCancelButton: true,
    confirmButtonText: options.confirmButtonText ?? 'Si, continuar',
    cancelButtonText: options.cancelButtonText ?? 'Cancelar',
    reverseButtons: true,
  })

  return result.isConfirmed
}
