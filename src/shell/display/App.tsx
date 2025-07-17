import { useEffect, useState } from "react";
import { useTransition, animated } from "@react-spring/web";
// import "./index.css";

import Login from "../../components/login";
import Splash from "../../components/boot/splash";
import Cursor from "../../assets/cursor.svg";

export function App() {
  const [isBooting, setIsBooting] = useState(true);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setIsBooting(false);
    }, 1500);
    return () => clearTimeout(timeout);
  }, []);

  // transition เฉพาะ login (isBooting === false)
  const loginTransition = useTransition(!isBooting, {
    from: { opacity: 0, transform: "scale(0.95)" },
    enter: { opacity: 1, transform: "scale(1)" },
    leave: { opacity: 0 },
    config: { tension: 280, friction: 30 },
  });

  return (
    <div
      style={{
        cursor: `url(${Cursor}) 0 0, auto`,
        width: "100vw",
        height: "100vh",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Splash แสดงนิ่งๆ ถ้ายัง booting อยู่ */}
      {isBooting && (
        <div style={{ position: "absolute", inset: 0 }}>
          <Splash />
        </div>
      )}

      {/* Login แสดงพร้อม animation เฉพาะตอน booting เสร็จ */}
      {loginTransition((style, item) =>
        item ? (
          <animated.div style={{ ...style, position: "absolute", inset: 0 }}>
            <Login />
          </animated.div>
        ) : null
      )}
    </div>
  );
}

export default App;
