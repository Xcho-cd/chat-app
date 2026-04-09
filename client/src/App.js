import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import "./App.css";

const socket = io("http://localhost:3001");

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isAuth, setIsAuth] = useState(false);

  const [room] = useState("general");
  const [message, setMessage] = useState("");
  const [chat, setChat] = useState([]);

  // 🔐 авто вход
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      setUsername(savedUser);
      setIsAuth(true);
      socket.emit("join_room", room);
    }
  }, []);

  // 📩 сокеты
  useEffect(() => {
    socket.on("load_messages", (data) => {
      setChat(data);
    });

    socket.on("receive_message", (data) => {
      setChat((prev) => [...prev, data]);
    });

    socket.on("message_deleted", (id) => {
      setChat((prev) => prev.filter((msg) => msg._id !== id));
    });

    socket.on("message_edited", (updatedMsg) => {
      setChat((prev) =>
        prev.map((msg) =>
          msg._id === updatedMsg._id ? updatedMsg : msg
        )
      );
    });

    return () => {
      socket.off("receive_message");
    };
  }, []);

  // 🔐 регистрация
  const register = () => {
    if (!username || !password) return alert("Заполни все поля");

    const users = JSON.parse(localStorage.getItem("users")) || [];

    if (users.find((u) => u.username === username)) {
      return alert("Пользователь уже есть");
    }

    users.push({ username, password });
    localStorage.setItem("users", JSON.stringify(users));

    alert("Регистрация успешна");
    setIsLogin(true);
  };

  // 🔑 вход
  const login = () => {
    const users = JSON.parse(localStorage.getItem("users")) || [];

    const user = users.find(
      (u) => u.username === username && u.password === password
    );

    if (!user) return alert("Неверные данные");

    localStorage.setItem("user", username);
    setIsAuth(true);

    socket.emit("join_room", room);
  };

  // 🚪 выход
  const logout = () => {
    localStorage.removeItem("user");
    setIsAuth(false);
  };

  // 📤 отправка
  const sendMessage = () => {
    if (message !== "") {
      socket.emit("send_message", {
        room,
        author: username,
        message,
        time: new Date().toLocaleTimeString(),
      });

      setMessage("");
    }
  };

  if (!isAuth) {
    return (
      <div className="join">
        <h2>{isLogin ? "Login" : "Register"}</h2>

        <input
          placeholder="Username"
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />

        {isLogin ? (
          <>
            <button onClick={login}>Login</button>
            <p onClick={() => setIsLogin(false)}>Нет аккаунта?</p>
          </>
        ) : (
          <>
            <button onClick={register}>Register</button>
            <p onClick={() => setIsLogin(true)}>Уже есть аккаунт?</p>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="app">
<div className="sidebar">
  <div className="user-info">
    <div className="avatar">
      {username[0]?.toUpperCase()}
    </div>

    <div className="user-text">
      <h3>{username}</h3>
      <span>🟢 online</span>
    </div>
  </div>

  <button className="logout-btn" onClick={logout}>
    Logout
  </button>
</div>

      <div className="chat">
        <div className="chat-header">General Chat</div>

        <div className="chat-body">
          {chat.map((msg) => (
            <div
              key={msg._id}
              className={
                msg.author === username ? "message own" : "message"
              }
            >
              <b>{msg.author}</b>
              <p>{msg.message}</p>
              <span>{msg.time}</span>

              {msg.author === username && (
                <div>
                  <button
                    onClick={() =>
                      socket.emit("delete_message", {
                        id: msg._id,
                        room,
                      })
                    }
                  >
                    ❌
                  </button>

                  <button
                    onClick={() => {
                      const text = prompt("Edit:");
                      socket.emit("edit_message", {
                        id: msg._id,
                        text,
                        room,
                      });
                    }}
                  >
                    ✏️
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="chat-footer">
          <input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button onClick={sendMessage}>➤</button>
        </div>
      </div>
    </div>
  );
}

export default App;