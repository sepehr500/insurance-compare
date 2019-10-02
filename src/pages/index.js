import React from "react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Legend,
  Line,
  Tooltip,
} from "recharts"
import { Input as SInput, Button, Card } from "semantic-ui-react"
import { update, last, max } from "ramda"

import Layout from "../components/layout"

const BLANK_PLAN = {
  name: "plan 1",
  premium: 0,
  maxOOP: 0,
  coinsurance: 0,
  deductable: 0,
}

const COLORS = ["red", "blue", "green", "purple"]

const MAX_SPENT = 20000

const CustomTooltip = ({ active, payload, label }) => {
  // console.log(active)
  console.log(payload)
  if (active) {
    return (
      <div className="b--solid pa2 mv2">
        {payload.map(p => (
          <div key={p.name}>
            {p.name}: ${p.payload.afterCoverage}
          </div>
        ))}
        before coverage: {payload[0].payload.beforeCoverage}
      </div>
    )
  }

  return null
}

const Input = ({ label, id, onChange, name, value, type }) => (
  <div className="mv2 mh2">
    <label className="db pb1 b" htmlFor={id}>
      {label}
    </label>
    <SInput
      size="small"
      type={type}
      onChange={onChange}
      name={name}
      value={value}
    />
  </div>
)

class IndexPage extends React.Component {
  state = {
    plans: [
      {
        name: "G1",
        premium: 0,
        maxOOP: 6350,
        coinsurance: 80,
        deductable: 2000,
      },
      {
        name: "F3",
        premium: 56.6,
        maxOOP: 4000,
        coinsurance: 80,
        deductable: 1000,
      },
      {
        name: "G5",
        premium: 101.37,
        maxOOP: 3000,
        coinsurance: 100,
        deductable: 2000,
      },
      {
        name: "F2",
        premium: 135.43,
        maxOOP: 3000,
        coinsurance: 80,
        deductable: 500,
      },
    ],
  }

  handleValueChange(value, name, index) {
    const planCopy = Object.assign({}, this.state.plans[index])
    planCopy[name] = name === "name" ? value : parseInt(value)
    this.setState({ plans: update(index, planCopy, this.state.plans) })
  }

  addPlan = () => {
    this.setState({
      plans: this.state.plans.concat(
        Object.assign(BLANK_PLAN, {
          name: `plan ${this.state.plans.length + 1}`,
        })
      ),
    })
  }
  render() {
    const series = []

    this.state.plans.forEach((plan, i) => {
      series[i] = {
        name: plan.name,
        data: [],
      }
      for (let index = 0; index < MAX_SPENT; index = index + 50) {
        const yearPremium = plan.premium * 12
        const coInsuranceDecim = 1 - plan.coinsurance / 100
        if (
          last(series[i].data) &&
          last(series[i].data).afterCoverage - yearPremium >= plan.maxOOP
        ) {
          series[i].data.push({
            afterCoverage: last(series[i].data).afterCoverage,
            beforeCoverage: index,
          })
        } else if (index < plan.deductable) {
          series[i].data.push({
            afterCoverage: index + yearPremium,
            beforeCoverage: index,
          })
        } else {
          series[i].data.push({
            afterCoverage:
              yearPremium +
              plan.deductable +
              (index - plan.deductable) * coInsuranceDecim,
            beforeCoverage: index,
          })
        }
      }
    })

    return (
      <Layout>
        <p>
          <b>How to use the chart:</b> First figure out how much you are likely
          to pay if you had no insurance. This is hard to do, but is possible.
          For example, if you have two annual procedures that cost $600 each
          time, I can expect to pay $1,200 annualy. Then on the chart, find 1200
          on the X axis, then the plan lowest on the Y axis is likely the best
          for you. Also interesting to note, F2 is least likely to be worth it.
        </p>
        {this.state.plans.map((plan, index) => {
          return (
            <div
              key={plan.name}
              className="b--solid pa2 mv2"
              style={{ display: "flex", flexWrap: "wrap" }}
            >
              <Input
                onChange={e =>
                  this.handleValueChange(e.target.value, e.target.name, index)
                }
                label="Plan name"
                name="name"
                value={plan.name}
              />
              <Input
                type="number"
                onChange={e =>
                  this.handleValueChange(e.target.value, e.target.name, index)
                }
                name="premium"
                label="Premium($)"
                value={plan.premium}
              />
              <Input
                type="number"
                onChange={e =>
                  this.handleValueChange(e.target.value, e.target.name, index)
                }
                name="maxOOP"
                label="Max out of pocket($)"
                value={plan.maxOOP}
              />
              <Input
                type="number"
                onChange={e =>
                  this.handleValueChange(e.target.value, e.target.name, index)
                }
                name="coinsurance"
                label="Coinsurance(%)"
                value={plan.coinsurance}
              />
              <Input
                type="number"
                onChange={e =>
                  this.handleValueChange(e.target.value, e.target.name, index)
                }
                name="deductable"
                label="Deductable($)"
                value={plan.deductable}
              />
            </div>
          )
        })}
        <div className="mv3">
          <Button onClick={this.addPlan}>Add</Button>
        </div>
        <LineChart width={1000} height={1000}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            allowDuplicatedCategory={false}
            dataKey="beforeCoverage"
            type="number"
            label={{
              value: "Price before coverage per year",
              position: "insideBottom",
              offset: 0,
            }}
          />
          <YAxis
            allowDuplicatedCategory={false}
            dataKey="afterCoverage"
            type="number"
            label={{
              value: "Price after coverage per year",
              angle: -90,
              position: "insideLeft",
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {series.map((s, i) => (
            <Line
              type="monotone"
              stroke={COLORS[i]}
              dataKey="afterCoverage"
              data={s.data}
              name={s.name}
              key={s.name}
            />
          ))}
        </LineChart>
      </Layout>
    )
  }
}

export default IndexPage
