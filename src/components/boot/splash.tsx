import Logo from "../../assets/logo.svg";

function Splash() {
  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-black text-white">
      <div className="w-16 h-16 mb-6">
        <img src={Logo} alt="VeloOS Logo" className="w-full h-full object-contain" />
      </div>
    </div>
  );
}

export default Splash;
