import { Routes, Route } from 'react-router-dom'
import Navbar from "./components/Navbar"
import HomePage from './pages/HomePage'
import Signup from './pages/Signup'
import Login from './pages/Login'
import Settings from './pages/Settings'
import Profile from './pages/Profile'
import { Navigate } from 'react-router-dom'
import useAuthStore from "./store/useAuthStore"
import { useDebugValue, useEffect } from 'react'
import { Loader } from 'lucide-react'
import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import useThemeStore from './store/useThemeStore'



function App() {
  const { checkAuth, authUser, isCheckingAuth, connectSocket, onlineUsers, disconnectSocket, socket } = useAuthStore();
  const { theme } = useThemeStore();

  console.log({onlineUsers});

  useEffect(() => {
    checkAuth();
  }
  , [checkAuth]);
  console.log("Auth User Details:", {
    authUser: authUser,
    userId: authUser?._id,
    isAuthenticated: !!authUser
  });

  // useEffect(() => {
  //   if (authUser && !socket) {
  //     connectSocket();
  //   }
    
  //   return () => {
  //     if (socket) {
  //       disconnectSocket();
  //     }
  //   };
  // }, [authUser, socket, connectSocket, disconnectSocket]);

  console.log({authUser});



  if(isCheckingAuth && !authUser){
    return(
      <div className="flex items-center justify-center h-screen">
        <Loader className = "size-10 animate-spin" />
      </div>
    )
  }
  return (
    <div data-theme={theme}>  
    <Navbar/>
        <Routes>
          <Route path="/" element={authUser ? <HomePage /> : <Navigate to = "/login"/> } />
          <Route path="/signup" element={!authUser ? <Signup /> : <Navigate to = "/"/>} />
          <Route path="/login" element={!authUser ? <Login /> : <Navigate to = "/"/>} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/profile" element={authUser ? <Profile /> : <Navigate to = "/login"/> } />
        </Routes>
        <Toaster/>
    </div>
  )
}

export default App
