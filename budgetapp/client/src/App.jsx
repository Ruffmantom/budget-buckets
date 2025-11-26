import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import useHelloStore from "./store/helloStore.js";
import ButtonLink from "./components/common/buttonLink.jsx";
import ButtonAction from "./components/common/ButtonAction.jsx";
import FormInput from "./components/common/FormInput.jsx";
import Tooltip from "./components/common/Tooltip.jsx";
import Info from "./components/common/Info.jsx";
import InfoAlert from "./components/common/InfoAlert.jsx";
import TopNavigation from "./components/common/TopNavigation.jsx";
// testing
function App() {
  const { getHello } = useHelloStore();
  const [nameInputValue, setNameInputValue] = useState("");

  const handleHelloButtonClick = async (e) => {
    e.preventDefault();
    const response = await getHello(nameInputValue);

    if (response?.data?.message) {
      toast.success(response.data.message, {
        position: "top-center",
      }); // uses react-toastify
      setNameInputValue("");
    }
  };

  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route
            exact
            path="/"
            element={
              <div className="w-full flex flex-col p-2">
                <TopNavigation/>
              </div>
            }
          />

          {/* 404 error page */}
          <Route
            exact
            path="*"
            element={
              <>
                <div className="w-xl p-4 m-auto flex gap-2 flex-col items-center">
                  <h1 className="text-5xl font-bold">
                    404 there was an error finding this page
                  </h1>
                </div>
              </>
            }
          />
        </Routes>
        {/* <DevMenu /> */}
        <ToastContainer />
      </BrowserRouter>
    </>
  );
}

export default App;
