import React, { useState } from "react";

export function UserSignInForm() {
  const [form, setForm] = useState({ email: "", password: "" });
  return (
    <form>
      <h2>Sign In</h2>
      <input
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={e => setForm({ ...form, email: e.target.value })}
      />
      <input
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={e => setForm({ ...form, password: e.target.value })}
      />
      <button type="submit">Sign In</button>
    </form>
  );
}
