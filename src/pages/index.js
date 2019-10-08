import React from "react"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Legend,
  Line,
  Tooltip,
  ResponsiveContainer,
} from "recharts"
import { Input as SInput, Button, Popup, Icon } from "semantic-ui-react"
import { update, last } from "ramda"

import Layout from "../components/layout"

const memo = fn => {
  const cache = {}
  return param => {
    const hitCache = cache[param]
    if (hitCache) {
      return hitCache
    }
    const result = fn(param)
    cache[param] = result
    return result
  }
}

const getUniqueId = () => {
  return (
    "_" +
    Math.random()
      .toString(36)
      .substr(2, 9)
  )
}

const BLANK_PLAN = {
  name: "plan 1",
  premium: 0,
  maxOOP: 0,
  coinsurance: 0,
  deductable: 0,
}

const COLORS = [
  "red",
  "blue",
  "green",
  "purple",
  "black",
  "yellow",
  "orange",
  "deepskyblue",
]

const getColor = i => COLORS[i % COLORS.length]

const MAX_SPENT = 20000

const CustomTooltip = ({ active, payload, label }) => {
  if (active) {
    return (
      <div
        className="border-solid
      border-2 rounded-lg  shadow-lg
      p-2 my-2 bg-gray-200"
      >
        {payload.map(p => (
          <div key={p.name}>
            <span className="font-bold" style={{ color: p.stroke }}>
              {p.name}
            </span>
            : ${p.payload.afterCoverage.toFixed(0)}
          </div>
        ))}
        Before coverage: ${payload[0].payload.beforeCoverage}
      </div>
    )
  }

  return null
}

const Input = ({ label, id, onChange, name, value, type, popupText, icon }) => (
  <div className="m-2">
    <div className="pb-2">
      <label className="font-bold mr-2" htmlFor={id}>
        {label}
      </label>
      {popupText && (
        <Popup
          position="top center"
          basic
          content={popupText}
          trigger={<Icon name="info circle" />}
        />
      )}
    </div>
    <SInput
      icon={icon}
      max={icon === "percent" ? "100" : null}
      min="0"
      iconPosition={icon && "left"}
      className={icon === "percent" ? "w-32" : "w-40"}
      size="small"
      type={type}
      onChange={onChange}
      name={name}
      value={value === null ? "" : value}
    />
  </div>
)

class IndexPage extends React.Component {
  state = {
    beforeCoverage: 0,
    plans: [
      {
        name: "G1",
        premium: 0,
        maxOOP: 6350,
        coinsurance: 80,
        deductable: 2000,
        id: getUniqueId(),
      },
      {
        name: "F3",
        premium: 56.6,
        maxOOP: 4000,
        coinsurance: 80,
        deductable: 1000,
        id: getUniqueId(),
      },
      {
        name: "G5",
        premium: 101.37,
        maxOOP: 3000,
        coinsurance: 100,
        deductable: 2000,
        id: getUniqueId(),
      },
      {
        name: "F2",
        premium: 135.43,
        maxOOP: 3000,
        coinsurance: 80,
        deductable: 500,
        id: getUniqueId(),
      },
    ],
  }

  handleValueChange(value, name, index) {
    const planCopy = Object.assign({}, this.state.plans[index])
    planCopy[name] =
      name === "name" ? value : value === "" ? "" : parseInt(value)
    this.setState({ plans: update(index, planCopy, this.state.plans) })
  }

  addPlan = () => {
    this.setState({
      plans: this.state.plans.concat(
        Object.assign({}, BLANK_PLAN, {
          name: `plan ${this.state.plans.length + 1}`,
          id: getUniqueId(),
        })
      ),
    })
  }

  deletePlan = i => {
    this.setState({
      plans: this.state.plans
        .slice(0, i)
        .concat(this.state.plans.slice(i + 1, this.state.plans.length)),
    })
  }

  calculateInsurance = memo(strPlan => {
    const plan = JSON.parse(strPlan)
    const data = []
    for (let index = 0; index < MAX_SPENT; index = index + 100) {
      const yearPremium = plan.premium * 12
      const coInsuranceDecim = 1 - plan.coinsurance / 100
      if (last(data) && last(data).afterCoverage - yearPremium >= plan.maxOOP) {
        data.push({
          afterCoverage: last(data).afterCoverage,
          beforeCoverage: index,
        })
      } else if (index < plan.deductable) {
        data.push({
          afterCoverage: index + yearPremium,
          beforeCoverage: index,
        })
      } else {
        data.push({
          afterCoverage:
            yearPremium +
            plan.deductable +
            (index - plan.deductable) * coInsuranceDecim,
          beforeCoverage: index,
        })
      }
    }
    return data
  })

  findBestPlan = (series, beforeCoverageAmount) => {
    return series
      .map(line => {
        const filteredAmounts = line.data.filter(point => {
          return point.beforeCoverage <= beforeCoverageAmount
        })
        return {
          name: line.name,
          afterCoverage:
            filteredAmounts[filteredAmounts.length - 1].afterCoverage,
        }
      })
      .reduce((acc, cur) => (acc.afterCoverage < cur.afterCoverage ? acc : cur))
  }
  render() {
    const series = []

    this.state.plans.forEach((plan, i) => {
      series[i] = {
        name: plan.name,
        data: this.calculateInsurance(JSON.stringify(plan)),
      }
    })

    const result = this.findBestPlan(series, this.state.beforeCoverage || 0)


    return (
      <Layout>
        <p className="text-xl">
          <b>How to use the chart:</b> First figure out how much you are likely
          to pay if you had no insurance. This is hard to do, but is possible.
          For example, if you have two annual procedures that cost $600 each
          time, I can expect to pay $1,200 annualy. Then on the chart, find
          $1,200 on the X axis, then the plan lowest on the Y axis is likely the
          best for you.
        </p>
        {this.state.plans.map((plan, index) => {
          return (
            <div
              key={plan.id}
              className="p-2 my-2 border-2 rounded-lg  shadow-lg relative"
            >
              <div
                style={{ borderColor: getColor(index) }}
                className="border-l-2 border-solid flex flex-wrap"
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
                  label="Premium"
                  icon="dollar"
                  value={plan.premium}
                  popupText="Amount you pay every month"
                />
                <Input
                  type="number"
                  onChange={e =>
                    this.handleValueChange(e.target.value, e.target.name, index)
                  }
                  icon="dollar"
                  name="maxOOP"
                  label="Max out of pocket"
                  value={plan.maxOOP}
                />
                <Input
                  type="number"
                  onChange={e =>
                    this.handleValueChange(e.target.value, e.target.name, index)
                  }
                  name="coinsurance"
                  label="Coinsurance"
                  icon="percent"
                  value={plan.coinsurance}
                  popupText="Amount your insurance will pay after you hit your deductable"
                />
                <Input
                  type="number"
                  onChange={e =>
                    this.handleValueChange(e.target.value, e.target.name, index)
                  }
                  name="deductable"
                  label="Deductable"
                  icon="dollar"
                  value={plan.deductable}
                  popupText="Amount you need to pay until your insurance kicks in"
                />
              </div>
              <Button
                aria-label="Delete"
                className="absolute"
                style={{ top: "6px", right: "-1px" }}
                icon
                onClick={() => this.deletePlan(index)}
              >
                <Icon name="trash" />
              </Button>
            </div>
          )
        })}
        <div className="my-2">
          <Button onClick={this.addPlan}>Add Insurance</Button>
        </div>
        <div>
          <Input
            onChange={e =>
              this.setState({ beforeCoverage: parseInt(e.target.value) })
            }
            type="number"
            icon="dollar"
            label="Enter amount you would pay if you had no insurance"
            name="beforeCoverage"
            value={isNaN(this.state.beforeCoverage) ? "" : this.state.beforeCoverage}
          />
        </div>
        {!isNaN(this.state.beforeCoverage) && <h2>
          If you plan on spending ${this.state.beforeCoverage} then the best is
          option is <span style={{color: getColor(this.state.plans.findIndex(plan => plan.name === result.name))}}>{result.name}</span>. You would spend ${result.afterCoverage.toFixed(0)}.
        </h2>}
        <ResponsiveContainer width={"99%"} height={1000}>
          <LineChart>
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
        </ResponsiveContainer>
      </Layout>
    )
  }
}

export default IndexPage
