import { useEffect, useState } from "react"
import { supabase } from "../../../supabase"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

function ProductMonthlyStats({ productId }) {
  const [labels, setLabels] = useState([])
  const [unitsSold, setUnitsSold] = useState([])
  const [earnings, setEarnings] = useState([])

  useEffect(() => {
    async function fetchStats() {
      const { data, error } = await supabase
        .from("order_item")
        .select(`
          quantity,
          order:order_id (
            ordered_at,
            is_deleted,
            status
          )
        `)
        .eq("product_id", productId)

      if (error) {
        console.error("Error fetching product monthly stats:", error)
        return
      }

      const monthlyStats = {}

      data.forEach((item) => {
        const order = item.order
        if (!order || order.is_deleted || order.status === "Cancelled") return

        const date = new Date(order.ordered_at)
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`

        if (!monthlyStats[key]) {
          monthlyStats[key] = { quantity: 0, earnings: 0 }
        }

        monthlyStats[key].quantity += item.quantity
        monthlyStats[key].earnings += item.quantity * item.price || 0
      })

      const sortedKeys = Object.keys(monthlyStats).sort()

      setLabels(sortedKeys)
      setUnitsSold(sortedKeys.map((k) => monthlyStats[k].quantity))
      setEarnings(sortedKeys.map((k) => monthlyStats[k].earnings))
    }

    fetchStats()
  }, [productId])

  const baseOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
    },
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl shadow p-4">
        <h3 className="text-lg font-semibold mb-2">Units Sold Per Month</h3>
        <Line
          options={baseOptions}
          data={{
            labels,
            datasets: [
              {
                label: "Units Sold",
                data: unitsSold,
                borderColor: "#3b82f6",
                backgroundColor: "rgba(59, 130, 246, 0.5)",
                fill: true,
              },
            ],
          }}
        />
      </div>

      <div className="bg-white rounded-2xl shadow p-4">
        <h3 className="text-lg font-semibold mb-2">Earnings Per Month (₱)</h3>
        <Line
          options={baseOptions}
          data={{
            labels,
            datasets: [
              {
                label: "Earnings (₱)",
                data: earnings,
                borderColor: "#16a34a",
                backgroundColor: "rgba(22, 163, 74, 0.5)",
                fill: true,
              },
            ],
          }}
        />
      </div>
    </div>
  )
}

export default ProductMonthlyStats
