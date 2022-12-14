const fs = require('fs')
const csv = require('csvtojson')
const prompt = require('prompt-sync')
const axios = require('axios')
const nameList = [
  'Laub',
  'Lily',
  'John',
  'Nathan',
  'Derek',
  'Samson',
  'Timothy',
  'Jerry',
  'Adrian',
  'William',
  'Lincoln',
  'Heria',
  'Joe',
]

/*ENTER THE PLAYER HERE*/
/*ENTER THE PLAYER HERE*/
/*ENTER THE PLAYER HERE*/
/*ENTER THE PLAYER HERE*/
/*ENTER THE PLAYER HERE*/
/*ENTER THE PLAYER HERE*/
/*ENTER THE PLAYER HERE*/
/*ENTER THE PLAYER HERE*/
let players = ['Laub', 'Lily', 'John', 'Joe', 'Heria', 'Lincoln']
/*ENTER THE PLAYER HERE*/
/*ENTER THE PLAYER HERE*/
/*ENTER THE PLAYER HERE*/
/*ENTER THE PLAYER HERE*/
/*ENTER THE PLAYER HERE*/
/*ENTER THE PLAYER HERE*/
/*ENTER THE PLAYER HERE*/
/*ENTER THE PLAYER HERE*/

players = players.map(t => {
  const d = t.toLowerCase()
  return d.charAt(0).toUpperCase() + d.slice(1)
})
for (let player of players) {
  if (!nameList.includes(player)) {
    throw new Error('Player not found, ', player)
  }
}
async function DivideTeamBasedOnWinPercentage() {
  const rankings = await GetRankingsFromCSV()
  const relevantRankings = rankings.filter(t => players.includes(t.Name))
  const sortedRankings = relevantRankings.sort(
    (a, b) => b.Percentage - a.Percentage,
  )
  const highestPercentage = sortedRankings[0].Percentage
  const lowestPercentage = sortedRankings[sortedRankings.length - 1].Percentage
  let relativeRankings = sortedRankings.map(t => {
    return {
      Name: t.Name,
      RelativePercentage:
        ((t.Percentage - lowestPercentage) /
          (highestPercentage - lowestPercentage)) *
          0.75 +
        0.25,
    }
  })
  let leftTeam = []
  let rightTeam = []
  let randomStartTeam = Math.random() > 0.5 ? 'left' : 'right'
  let remainingRankings = JSON.parse(JSON.stringify(relativeRankings))
  for (let i = 0; i < players.length; i++) {
    const player = GetRandomPlayerFromRelativeRankings(remainingRankings)
    remainingRankings = remainingRankings.filter(t => t.Name !== player)
    if (i % 2 === (randomStartTeam === 'left' ? 0 : 1)) {
      leftTeam.push(player)
    } else {
      rightTeam.push(player)
    }
  }
  leftTeam = RandomizeArray(leftTeam)
  rightTeam = RandomizeArray(rightTeam)
  console.log('\n')
  console.log(
    leftTeam.map((t, i) => `${leftTeam.length - i}. ${t}`).join(', '),
    '\t\t\t',
    rightTeam.map((t, i) => `${i + 5}. ${t}`).join(', '),
  )
  console.log('\n')
  while (true) {
    const winTeam = prompt()('WHO WIN? L for Left Team, R for Right Team\n\n')
    if (winTeam.toLowerCase() === 'l') {
      await UpdateRankingsCSV(leftTeam, rightTeam)
    } else if (winTeam.toLowerCase() === 'r') {
      await UpdateRankingsCSV(rightTeam, leftTeam)
    } else {
      console.log('Please Type l or r ONLY')
    }
  }
}

function RandomizeArray(arr) {
  const newArr = []
  while (arr.length > 0) {
    const randomIndex = Math.floor(Math.random() * arr.length)
    newArr.push(arr[randomIndex])
    arr.splice(randomIndex, 1)
  }
  return newArr
}

function GetRandomPlayerFromRelativeRankings(relativeRankings) {
  const totalSum = relativeRankings.reduce(
    (a, b) => a + b.RelativePercentage,
    0,
  )
  const randomNum = Math.random() * totalSum
  let curSum = 0
  for (let r of relativeRankings) {
    curSum += r.RelativePercentage
    if (curSum >= randomNum) {
      return r.Name
    }
  }
}

async function GetRankingsFromCSV() {
  const result = (
    await axios.get(
      'https://timothylam.api.stdlib.com/mario-striker-ranking@dev/table/',
    )
  ).data
  if (result.statusCode !== 200) {
    throw new Error('Error getting rankings')
  }
  const table = JSON.parse(result.body)
  return table.map(t => {
    let win = t.Win
    let lose = t.Lose
    if (win + lose < 10) {
      win += 5
      lose += 5
    }
    return {
      Name: t.Name,
      Win: win,
      Lose: lose,
      Percentage: (win + 1) / (win + lose + 2),
    }
  })
}

async function UpdateRankingsCSV(winTeam, loseTeam) {
  try {
    const result = (
      await axios.post(
        'https://timothylam.api.stdlib.com/mario-striker-ranking@dev/updateRanking/',
        {
          winTeam,
          loseTeam,
        },
      )
    ).data
    console.log(result)
    if (result.statusCode !== 200) {
      throw new Error('Error updating rankings')
    }
  } catch (e) {
    console.log(e)
  }
  // const files = fs.readdirSync('.')
  // const csvFile = files.find(file => file.includes('.csv'))
  // const jsonArr = await csv().fromFile(csvFile)
  // const updatedJsonArr = jsonArr.map(t => {
  //   if (winTeam.includes(t.Name)) {
  //     t.Win = parseInt(t.Win) + 1
  //   } else if (loseTeam.includes(t.Name)) {
  //     t.Lose = parseInt(t.Lose) + 1
  //   }
  //   return t
  // })
  // const csvData = [
  //   'Name,Win,Lose,Percentage',
  //   ...updatedJsonArr.map((t, i) => {
  //     return `${t.Name},${t.Win},${t.Lose},${(
  //       ((parseInt(t.Win) + 1) / (parseInt(t.Win) + parseInt(t.Lose) + 2)) *
  //       100
  //     ).toFixed(4)}%`
  //   }),
  // ].join('\n')

  // fs.writeFileSync(csvFile, csvData)
  // console.log(updatedJsonArr)
}
DivideTeamBasedOnWinPercentage()
