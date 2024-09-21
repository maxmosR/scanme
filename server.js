const express = require('express');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Path to the file where counter data will be stored
const counterFilePath = path.join(__dirname, 'counter.json');

// Function to load counter data
const loadCounterData = () => {
  try {
    const data = fs.readFileSync(counterFilePath);
    return JSON.parse(data);
  } catch (err) {
    // If the file doesn't exist or an error occurs, return default values
    return { date: new Date().toLocaleDateString(), count: 0 };
  }
};

// Function to save counter data
const saveCounterData = (data) => {
  fs.writeFileSync(counterFilePath, JSON.stringify(data));
};

// Load counter data on startup
let { date: lastDate, count: ticketCount } = loadCounterData();

app.get('/generate-ticket', async (req, res) => {
  try {
    // Get the current date
    const now = new Date();
    const currentDate = now.toLocaleDateString();

    // Check if the date has changed and reset the counter if necessary
    if (currentDate !== lastDate) {
      ticketCount = 0;
      lastDate = currentDate;
    }

    // Increment the ticket count
    ticketCount += 1;

    // Save the updated counter data
    saveCounterData({ date: currentDate, count: ticketCount });

    // Create a new PDF document
    const pdfDoc = await PDFDocument.create();
    const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);

    // Add a page and draw some text
    const page = pdfDoc.addPage([850, 500]);
    page.drawText('Ticket',                             { x: 50, y: 350, size: 30, font: timesRomanFont, color: rgb(0, 0, 0) });
    page.drawText(`Data: ${currentDate}`,               { x: 50, y: 300, size: 20, font: timesRomanFont, color: rgb(0, 0, 0) });
    page.drawText(`Ore : ${now.toLocaleTimeString()}`,  { x: 50, y: 270, size: 20, font: timesRomanFont, color: rgb(0, 0, 0) });
    page.drawText(`Numero del Ticket: ${ticketCount}`,  { x: 50, y: 240, size: 20, font: timesRomanFont, color: rgb(0, 0, 0) });
    page.drawText("Si segnala che il numero del ticket potrebbe non essere corretto.\n"+
      "I dati più affidabili sono la data e l'orario. Questo servizio, fornito da volontari,\n"+
      "non offre garanzie specifiche, ma è stato istituito per mantenere un minimo di ordine.\n"+
      "Serve a gestire le richieste di informazioni da parte di coloro che non hanno un appuntamento.\n"+
      "Si prega di attendere di ricevere i numeri dal personale incaricato.", { x: 50, y: 200, size: 20, font: timesRomanFont, color: rgb(0, 0, 0) })


    // Serialize the PDFDocument to bytes (Uint8Array)
    const pdfBytes = await pdfDoc.save();

    // Set the response headers and send the PDF
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="ticket-${ticketCount}.pdf"`,
      'Content-Length': pdfBytes.length
    });
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating ticket');
  }
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
