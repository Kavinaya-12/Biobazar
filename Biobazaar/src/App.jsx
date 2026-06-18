import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import CheckAuth from "./Components/CheckAuth";
import Header from "./Components/Header"
import Home from "./Components/Home";
import Login from "./Components/Login";
import Signup from "./Components/Signup";
import CartPage from "./Components/Cart";
import Profile from "./Components/Profile";
import Sell from "./Components/Sell";
import Wishlist from "./Components/Wishlist";
import Collec from "./Components/Collec";
import AboutUs from "./Components/AboutUs";
import Foods from "./Components/Foods";
import PersonalCare from "./Components/PersonalCare";
import LifeStyle from "./Components/Lifestyle";
import Household from "./Components/Household";
import SearchResults from "./Components/SearchResults";


function App() {
  return (
    <Router>
      <Header/>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<CheckAuth><Login /></CheckAuth>} />
        <Route path="/signup" element={<CheckAuth><Signup /></CheckAuth>} />
        <Route path="/cart" element={<CheckAuth><CartPage/></CheckAuth>} />
        <Route path="/profile" element={<CheckAuth><Profile /></CheckAuth>} />
        <Route path="/sell" element={<CheckAuth><Sell /></CheckAuth>} />
        <Route path="/wishlist" element={<CheckAuth><Wishlist /></CheckAuth>} />
        <Route path="/collections" element={<CheckAuth><Collec/></CheckAuth>}/>
        <Route path="/aboutus" element={<CheckAuth><AboutUs/></CheckAuth>}/>
        <Route path="/collections/foods" element={<CheckAuth><Foods/> </CheckAuth>} />
        <Route path="/search-results" element={<CheckAuth><SearchResults/></CheckAuth>}/>
        <Route path="/collections/personalcare" element={<CheckAuth> <PersonalCare/> </CheckAuth>} />
        <Route path="/collections/lifestyle" element={<CheckAuth>  <LifeStyle/>    </CheckAuth>}/>
        <Route path="/collections/household" element={<CheckAuth><Household/> </CheckAuth>}/>
        <Route path="/profile/:userId" element={<CheckAuth><Profile/></CheckAuth>}/>

            {/* <Route path="/profile/" element={<Profile />} /> */}

      </Routes>
    </Router>
  );
}

export default App;
