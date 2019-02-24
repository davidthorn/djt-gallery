import express from 'express'
import cors from 'cors'
const app = express()
app.use(express.static('src'))
app.use(cors)

app.listen(8080, () => {
    console.log('listening')
}) 