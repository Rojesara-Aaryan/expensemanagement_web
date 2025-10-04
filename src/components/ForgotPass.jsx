import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

const ForgotPass = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("http://localhost:8000/api/forgot-password/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setMessage("A password reset link has been sent to your email.");
        setTimeout(() => navigate("/welcome"), 2000); // redirect after 2 sec
      } else {
        const data = await response.json();
        setMessage(data.error || "Email not found.");
      }
    } catch (error) {
      console.error("Error:", error);
      setMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-pass-container">
      <h2>Forgot Password</h2>
      <p>Enter your registered email to reset your password.</p>

      <form onSubmit={handleSubmit} className="forgot-form">
        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="form-input"
        />

        <button type="submit" disabled={loading} className="form-button">
          {loading ? "Sending..." : "Send To Mail"}
        </button>
      </form>

      {message && <p className="message">{message}</p>}

      <p className="back-link">
        <Link to="/">Back to Sign In</Link>
      </p>
    </div>
  );
};

export default ForgotPass;
