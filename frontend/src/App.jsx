import { createBrowserRouter, RouterProvider } from "react-router-dom";
import RootLayout from "./layouts/RootLayout";
import Dashboard from "./pages/Dashboard";
import AddTransaction from "./pages/AddTransaction";
import Reports from "./pages/Reports";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      { path: "/", element: <Dashboard /> },
      { path: "/add", element: <AddTransaction /> },
      { path: "/reports", element: <Reports /> }
    ]
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;