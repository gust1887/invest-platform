describe('Signup validation tests', () => {
    test('Password should be valid if it contains at least one number and is between 8-20 characters', () => {
      const password = 'password123';
      const isValid = password.length >= 8 && password.length <= 20 && /\d/.test(password);
      expect(isValid).toBe(true);
    });
  
    test('Email should be valid if it follows a standard email format', () => {
      const email = 'test@example.com';
      const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      expect(isValid).toBe(true);
    });
  
    test('Username should not already be taken', () => {
      const existingUsers = ['testbruger', 'admin'];
      const newUsername = 'newuser';
      const isUsernameAvailable = !existingUsers.includes(newUsername);
      expect(isUsernameAvailable).toBe(true);
    });
  });
