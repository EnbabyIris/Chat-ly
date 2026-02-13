"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { LeftSection } from "@/components/auth/left-section";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";
import heroSectionImage from "@/assets/herosection.png";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { MASK_GRADIENTS } from "@/lib/constants/masks";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const leftImageRef = useRef<HTMLDivElement>(null);
  const rightImageRef = useRef<HTMLDivElement>(null);
  const [svgPaths, setSvgPaths] = useState<string[]>([]);

  // Redirect if already authenticated
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/chats");
    }
  }, [isAuthenticated, isLoading, router]);

  // Calculate SVG path after images render
  useEffect(() => {
    const calculatePath = () => {
      if (!leftImageRef.current || !rightImageRef.current) return;

      const leftRect = leftImageRef.current.getBoundingClientRect();
      const rightRect = rightImageRef.current.getBoundingClientRect();
      const containerRect =
        leftImageRef.current.parentElement?.getBoundingClientRect();

      if (!containerRect) return;

      // Right corner of left image (relative to container)
      const leftEndX = leftRect.right - 25;
      const leftEndY = leftRect.top + leftRect.height / 2 - containerRect.top;

      // Left corner center of right image (relative to container)
      const rightStartX = rightRect.left + 25;
      const rightStartY =
        rightRect.top + rightRect.height / 2 - containerRect.top;

      // Create curved paths with Y offsets
      const midX = (leftEndX + rightStartX) / 2;
      const controlPoint1X = leftEndX + (midX - leftEndX) * 0.3;
      const controlPoint2X = rightStartX - (rightStartX - midX) * 0.3;

      const paths = [0, 5, 10].map((yOffset) => {
        const controlPoint1Y = leftEndY + 50 + yOffset;
        const controlPoint2Y = rightStartY + 50 + yOffset;
        return `M ${leftEndX} ${leftEndY + yOffset} L ${controlPoint1X} ${controlPoint1Y}, ${controlPoint2X} ${controlPoint2Y}, ${rightStartX} ${rightStartY + yOffset}`;
      });

      setSvgPaths(paths);
    };

    // Calculate path after images render
    const timeoutId = setTimeout(calculatePath, 100);

    // Recalculate on window resize
    window.addEventListener("resize", calculatePath);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", calculatePath);
    };
  }, []);

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-100">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render if authenticated (redirect will happen)
  if (isAuthenticated) {
    return null;
  }

  // Floating messages data
  const floatingMessages = [
    {
      text: "Hey! 👋",
      isOwn: false,
      top: "75%",
      left: "80%",
      delay: 0,
      transform: "rotateX(20deg) rotateY(-25deg) rotateZ(10deg) scale(1.2)",
    },
    {
      text: "Connect with friends",
      isOwn: false,
      top: "70%",
      left: "12%",
      delay: 0.4,
      transform: "rotateX(20deg) rotateY(30deg) rotateZ(-10deg) scale(1.2)",
    },
    {
      text: "Real-time messaging 🚀",
      isOwn: false,
      top: "60%",
      left: "75%",
      delay: 0.8,
      transform: "rotateX(20deg) rotateY(-25deg) rotateZ(10deg) scale(1.2)",
    },
    {
      text: "Secure & private",
      isOwn: false,
      top: "55%",
      left: "5%",
      delay: 1.2,
      transform: "rotateX(20deg) rotateY(30deg) rotateZ(-10deg) scale(1.2)",
    },
    {
      text: "Join the conversation! 💬",
      isOwn: false,
      top: "45%",
      left: "70%",
      delay: 1.6,
      transform: "rotateX(20deg) rotateY(-25deg) rotateZ(10deg) scale(1.2)",
    },
  ];

  return (
    <div
      className="w-full gap-6 h-screen bg-stone-100 flex p-6 relative overflow-hidden"
      style={{
        backgroundImage:
          "radial-gradient(circle, rgba(0, 0, 0, 0.1) 1px, transparent 1px)",
        backgroundSize: "10px 10px",
      }}
    >
      <div
        className="w-full h-full bg-white z-50 absolute top-0 left-0"
        style={{
          maskImage:
            "linear-gradient(to bottom, transparent, transparent, transparent,transparent,transparent,transparent, white)",
          WebkitMaskImage:
            "linear-gradient(to bottom, transparent, transparent,transparent,transparent,transparent, transparent, white)",
        }}
      />
      {/* <LeftSection /> */}
      <div
        ref={leftImageRef}
        style={{
          transform:
            "rotateX(20deg) rotateY(30deg) rotateZ(-10deg) scale(1.2) ",
        }}
        className="w-1/3 border-4 border-neutral-200 rounded-xl absolute shadow-md bottom-0 transform "
      >
        <Image
          src={heroSectionImage}
          alt="login"
          height={500}
          className="rounded-2xl"
        />
      </div>
      <div
        ref={rightImageRef}
        style={{
          transform: "rotateX(20deg) rotateY(-25deg) rotateZ(10deg) scale(1.2)",
        }}
        className="w-1/3 border-4 border-neutral-200 rounded-xl right-0 absolute shadow-md bottom-0 transform "
      >
        <Image
          src={heroSectionImage}
          alt="login"
          height={500}
          className="rounded-2xl"
        />
      </div>

      {/* Connecting SVG Paths */}
      {svgPaths.length > 0 && (
        <svg
          className="absolute inset-0 pointer-events-none z-5"
          style={{ width: "100%", height: "100%" }}
        >
          {/* Static base lines */}
          {svgPaths.map((path, index) => (
            <path
              key={index}
              d={path}
              stroke="rgba(0,0,0,0.1)"
              strokeWidth="1"
              fill="none"
            />
          ))}

          {/* Animated dashed green lines */}
          {svgPaths.map((path, index) => (
            <path
              key={`animated-${index}`}
              d={path}
              stroke="#22c55e"
              strokeWidth="1"
              fill="none"
              strokeDasharray="50 1000"
              strokeDashoffset="0"
              style={{
                strokeOpacity: 0.8,
                animation: `dash-travel-${index} 6s ease-in-out infinite`,
                animationDelay: `${index * 0.3}s`,
                filter:
                  "drop-shadow(0 0 2px #22c55e) drop-shadow(0 0 4px #22c55e40)",
              }}
            />
          ))}
        </svg>
      )}

      <style jsx>{`
        @keyframes dash-travel-0 {
          0% {
            stroke-dashoffset: 1100;
          }
          25% {
            stroke-dashoffset: 1100;
          }
          65% {
            stroke-dashoffset: 50;
          }
          100% {
            stroke-dashoffset: 50;
          }
        }
        @keyframes dash-travel-1 {
          0% {
            stroke-dashoffset: 1100;
          }
          25% {
            stroke-dashoffset: 1100;
          }
          65% {
            stroke-dashoffset: 50;
          }
          100% {
            stroke-dashoffset: 50;
          }
        }
        @keyframes dash-travel-2 {
          0% {
            stroke-dashoffset: 1100;
          }
          25% {
            stroke-dashoffset: 1100;
          }
          65% {
            stroke-dashoffset: 50;
          }
          100% {
            stroke-dashoffset: 50;
          }
        }
      `}</style>

      {/* Floating Messages */}
      {floatingMessages.map((msg, index) => (
        <div
          key={index}
          className={cn(
            "absolute z-10 flex flex-col",
            msg.isOwn ? "items-end" : "items-start",
          )}
          style={{
            top: msg.top,
            left: msg.left,
            transform: msg.transform,
          }}
        >
          <div
            className={cn(
              "min-w-24 max-w-xs px-4 py-2 rounded-t-md",
              msg.isOwn ? "rounded-bl-md" : "rounded-br-md",
              msg.isOwn ? "bg-stone-200" : "bg-white",
              "text-neutral-900 border border-neutral-200 shadow-lg",
            )}
          >
            <p className="text-sm leading-relaxed">{msg.text}</p>
          </div>
          <div
            className={cn(
              "w-fit px-2 pt-1    border border-t-0 border-neutral-200",
              msg.isOwn
                ? "bg-stone-200 text-neutral-500 "
                : "text-neutral-300  bg-white",
              "  z-10 text-[9px] absolute bottom-0 translate-y-[46%]",
              msg.isOwn ? "right-0" : "left-0",
            )}
            style={{
              clipPath: "polygon(0 50%, 100% 50%, 100% 100%, 0% 100%)",
              borderRadius: "20px",
              // @ts-ignore - CSS property not in TypeScript definitions
              cornerShape: "superellipse(0)",
            }}
          >
            <p className="mt-1 px-4">now</p>
          </div>
        </div>
      ))}

      <motion.div
        layout
        style={{ zIndex: 4000, height: "fit-content" }}
        className="w-[28%] mx-auto mt-8  rounded-lg   ring-4 ring-neutral-200/70 bg-white flex flex-col  relative  items-center justify-center  pt-6 pb-4  z-20"
      >
        <div className="w-full max-w-md px-6">
          {isLogin ? (
            <LoginForm onSwitchToRegister={() => setIsLogin(false)} />
          ) : (
            <RegisterForm onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </div>
      </motion.div>
    </div>
  );
}
