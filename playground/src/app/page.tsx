import Sparkle from "../utils/Sparkle";
import SparkleBackground from "@/utils/SparkleBackground";

export default function Home() {
  return (<div>
    Hello GLAM Playground
    <Sparkle
      address="So11111111111111111111111111111111111111111"
      size={200}
    />
    <div className="border p-10">
      <SparkleBackground rows={6} cols={42} size={24} gap={5} static={true} visibleCount={252}/>
    </div>
    <br />
    <div className="border p-10">
      <SparkleBackground fadeOut={true} rows={6} cols={42} fadeInSpeed={1} size={24} gap={5} interval={3000} randomness={10} visibleCount={189} />
    </div>
    <br />
    <div className="border p-10">
      <SparkleBackground fadeOut={false} rows={6} cols={42} size={24} fadeInSpeed={1} gap={5} randomness={5} visibleCount={189} />
    </div>
    <br />
    <div className="border p-10">
      <SparkleBackground fadeOut={true} rows={6} cols={42} fadeInSpeed={0.2} fadeOutSpeed={5} size={24} gap={5} hover={true} />
    </div>
    <br />
    <div className="border p-10">
      <SparkleBackground fadeOut={false} rows={6} cols={42} fadeInSpeed={0.2} size={24} gap={5} hover={true} />
    </div>
  </div>);
}
