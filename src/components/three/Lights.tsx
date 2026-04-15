export default function Lights() {
  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[2, 3, 4]} intensity={1.8} />
      <pointLight position={[-3, 1, 3]} intensity={10} color="#A8F0C6" />
      <pointLight position={[3, -1, 2]} intensity={8} color="#D8FF72" />
    </>
  );
}