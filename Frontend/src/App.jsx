
import { BrowserRouter,Routes,Route } from "react-router-dom";
import Home from "./Home";
import Navbar from "./Navbar";
import Notfound from "./Notfound";
import Footer from "./Footer";
import Form from "./Form";
import Results from "./results";
function App() {
  return (
    
      <BrowserRouter>
      <Navbar/>
      <Routes>
        <Route path="/" element={<Home/>}/>
        <Route path='/form' element={<Form/>}/>
        <Route path='/results' element={<Results/>}/>
        <Route path="*" element={<Notfound/>}/>
      </Routes>
      <Footer/>
      </BrowserRouter>
    
  );
}

export default App;
