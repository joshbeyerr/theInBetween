import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LandingSection } from './components/LandingSection'
import { MapSection } from './components/MapSection'
import { ScrollToTop } from './components/ScrollToTop'
import About from './routes/About'
import Login from './routes/Login'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={
          <>
            <LandingSection />
            <MapSection />
          </>
        } />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  )
}
