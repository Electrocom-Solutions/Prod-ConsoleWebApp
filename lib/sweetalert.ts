import Swal from 'sweetalert2';

const darkThemeConfig = {
  background: '#1f2937',
  color: '#f9fafb',
  confirmButtonColor: '#3b82f6',
  cancelButtonColor: '#6b7280',
  customClass: {
    popup: 'dark-swal-popup',
    title: 'dark-swal-title',
    htmlContainer: 'dark-swal-text',
    confirmButton: 'dark-swal-confirm-btn',
    cancelButton: 'dark-swal-cancel-btn',
  }
};

export const showAlert = async (
  title: string,
  text?: string,
  icon: 'success' | 'error' | 'warning' | 'info' | 'question' = 'info'
) => {
  return Swal.fire({
    title,
    text,
    icon,
    ...darkThemeConfig,
  });
};

export const showConfirm = async (
  title: string,
  text?: string,
  confirmButtonText: string = 'Yes',
  cancelButtonText: string = 'Cancel'
) => {
  const result = await Swal.fire({
    title,
    text,
    icon: 'question',
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    ...darkThemeConfig,
  });
  return result.isConfirmed;
};

export const showSuccess = async (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'success',
    ...darkThemeConfig,
  });
};

export const showError = async (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'error',
    ...darkThemeConfig,
  });
};

export const showWarning = async (title: string, text?: string) => {
  return Swal.fire({
    title,
    text,
    icon: 'warning',
    ...darkThemeConfig,
  });
};

export const showDeleteConfirm = async (itemName: string = 'this item') => {
  return showConfirm(
    'Are you sure?',
    `Do you want to delete ${itemName}? This action cannot be undone.`,
    'Yes, delete it',
    'Cancel'
  );
};
