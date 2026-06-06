'use server';

export async function loginAction(email: string) {
  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  return { success: true, user: { id: 'mock-user-123', email } };
}

export async function signUpAction(email: string) {
  if (!email || !email.includes('@')) {
    throw new Error('Please enter a valid email address.');
  }
  return { success: true, user: { id: 'mock-user-123', email } };
}

export async function logoutAction() {
  return { success: true };
}
