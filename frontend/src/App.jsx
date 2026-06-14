import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Dashboard from './pages/Dashboard'
import Members from './pages/Members'
import Broadcasts from './pages/Broadcasts'
import Login from './pages/Login'

export default function App(){
  return (
    <BrowserRouter>
      <Routes>
        <Route path='/' element={<Dashboard/>} />
        <Route path='/members' element={<Members/>} />
        <Route path='/broadcasts' element={<Broadcasts/>} />
        <Route path='/login' element={<Login/>} />
      </Routes>
    </BrowserRouter>
  )
}
