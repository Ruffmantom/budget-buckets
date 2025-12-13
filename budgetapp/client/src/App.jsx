import React, { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// pages
import WelcomePage from "./pages/auth/WelcomePage.jsx"
// testing
function App() {



  return (
    <>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route
            exact
            path="/"
            element={
              <WelcomePage/>
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
