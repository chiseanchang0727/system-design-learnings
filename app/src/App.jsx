import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout.jsx'
import Home from './pages/Home.jsx'
import TopicPage from './pages/TopicPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="topics/:slug" element={<TopicPage />} />
        <Route path="topics/:slug/:subslug" element={<TopicPage />} />
      </Route>
    </Routes>
  )
}
