import { motion, useScroll } from "framer-motion";

export const ScrollProgressBar = () => {
  const { scrollYProgress } = useScroll();

  return (
    <motion.div
      id="scroll-indicator"
      style={{
        scaleX: scrollYProgress,
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        height: 4,
        originX: 0,
        backgroundColor: "#f78c01", // Princeton orange from color palette
        zIndex: 9999,
      }}
    />
  );
};
