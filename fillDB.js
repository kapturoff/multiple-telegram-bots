/**
 * It is a quite hardcoded script for filling database with all necessary
 * data to run development tests.
 *
 * **Do not use it anywhere.** At least, change database to MySQL, PostgreSQL or MongoDB
 * instead of using lowdb.
 */
async function fillDB() {
    const { JSONFileSync, LowSync } = await import('lowdb')
    const { config } = await import('dotenv')

    config() // Load variables from .env into process.env

    const { BOT_TOKEN_1, BOT_TOKEN_2 } = process.env

    // Setting up the connection to the database
    const adapter = new JSONFileSync('db.json')
    const db = new LowSync(adapter)

    // Setting up the database schema
    db.data = {
        bots: [],
        cities: [],
        restaraunts: [],
    }

    // Adding cities

    db.data.cities.push({
        id: 1,
        name: 'Краснодар',
    })

    db.data.cities.push({
        id: 2,
        name: 'London',
    })

    // Adding bots

    db.data.bots.push({
        botToken: BOT_TOKEN_1,
        cityId: 1,
        endpoint: 'bot1',
    })

    db.data.bots.push({
        botToken: BOT_TOKEN_2,
        cityId: 2,
        endpoint: 'bot2',
    })

    // Adding restaraunts

    db.data.restaraunts.push({
        id: 1,
        name: 'Краснодарский парень',
        cityId: 1,
    })

    db.data.restaraunts.push({
        id: 2,
        name: 'KFC',
        cityId: 1,
    })

    db.data.restaraunts.push({
        id: 3,
        name: 'McDonalds',
        cityId: 2,
    })

    db.data.restaraunts.push({
        id: 4,
        name: 'Пироговая',
        cityId: 2,
    })

    // Writing everything into database
    db.write()

    console.log('Finished!')
}

fillDB()
