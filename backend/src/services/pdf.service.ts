import PDFDocument from "pdfkit";

export class PDFService {
  static async generateInvoiceBuffer(
    booking: any,
    user: any,
    listing: any,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const buffers: Buffer[] = [];

        // Collect data chunks as they are generated
        doc.on("data", buffers.push.bind(buffers));
        doc.on("end", () => resolve(Buffer.concat(buffers)));

        // --- DRAW THE PDF ---

        // Header
        doc.fontSize(20).text("Stay Finder ", { align: "left" });
        doc.fontSize(10).text("Official Booking Receipt", { align: "left" });
        doc.moveDown();

        // Line separator
        doc.moveTo(50, 100).lineTo(550, 100).stroke();
        doc.moveDown();

        // Guest Info
        doc.fontSize(14).text("Guest Details", { underline: true });
        doc.fontSize(12).text(`Name: ${user.profile?.name || user.name || "Guest"}`);
        doc.text(`Email: ${user.email}`);
        doc.moveDown();

        // Stay Info
        doc.fontSize(14).text("Booking Details", { underline: true });
        doc.fontSize(12).text(`Property: ${listing.title}`);
        doc.text(`Check-In: ${new Date(booking.checkIn).toLocaleDateString()}`);
        doc.text(
          `Check-Out: ${new Date(booking.checkOut).toLocaleDateString()}`,
        );
        doc.text(`Booking ID: ${booking._id}`);
        doc.moveDown();

        // Financials
        doc
          .fontSize(16)
          .text(`Total Paid: INR ${booking.totalPrice}`, { align: "right" });

        // Footer
        doc.moveDown(4);
        doc
          .fontSize(10)
          .fillColor("gray")
          .text(
            "Thank you for booking with Stay Finder! We hope you enjoy your trip.",
            {
              align: "center",
            },
          );
        // Finalize the PDF
        doc.end();
      } catch (error) {
        reject(error);
      }
    });
  }
}
