// Production-safe Google Apps Script

const SHEET_NAME = "RSVP";

function doPost(e) {
    try {
        const contentType = (e.postData && e.postData.type) ? e.postData.type : "";
        let body = {};

        // Support JSON and x-www-form-urlencoded
        if (contentType.includes("application/json")) {
            body = JSON.parse(e.postData.contents || "{}");
        } else {
            body = {
                familyName: e.parameter.familyName || "",
                email: e.parameter.email || "",
                phone: e.parameter.phone || "",
                attending: e.parameter.attending || "",
                members: safeJsonParse_(e.parameter.members, [])
            };
        }

        const sheet = SpreadsheetApp.getActive().getSheetByName(SHEET_NAME);
        if (!sheet) {
            return json_({ ok: false, message: "Sheet nije pronađen." }, 500);
        }

        const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
        const col = (name) => headers.indexOf(name) + 1;

        const email = normalizeEmail_(body.email);
        const phone = normalizePhone_(body.phone);

        if (!email && !phone) {
            return json_({ ok: false, message: "E-mail ili broj mobitela su obavezni." }, 400);
        }

        // Simple rate limit (10 sec)
        const cache = CacheService.getScriptCache();
        const key = email || phone;
        if (cache.get(key)) {
            return json_({ ok: false, message: "Previše pokušaja. Pričekajte par sekundi." }, 429);
        }
        cache.put(key, "1", 10);

        const lastRow = sheet.getLastRow();
        const emailCol = col("Email");
        const phoneCol = col("Telefon");

        let matchRow = 0;

        if (lastRow >= 2) {
            if (email && emailCol > 0) {
                const values = sheet.getRange(2, emailCol, lastRow - 1).getValues().flat();
                const idx = values.findIndex(v => normalizeEmail_(String(v)) === email);
                if (idx !== -1) matchRow = idx + 2;
            }

            if (!matchRow && phone && phoneCol > 0) {
                const values = sheet.getRange(2, phoneCol, lastRow - 1).getValues().flat();
                const idx = values.findIndex(v => normalizePhone_(String(v)) === phone);
                if (idx !== -1) matchRow = idx + 2;
            }
        }

        const now = new Date();
        const members = Array.isArray(body.members) ? body.members : [];

        const rowData = {
            PrezimeObitelji: String(body.familyName || "").trim(),
            Email: email,
            Telefon: phone,
            Dolazim: String(body.attending || "").trim(),
            ZadnjaIzmjena: now
        };

        if (matchRow) {
            Object.entries(rowData).forEach(([key, value]) => {
                const c = col(key);
                if (c > 0) sheet.getRange(matchRow, c).setValue(value);
            });

            headers.forEach((h, idx) => {
                if (h && h.toString().startsWith("ImePrezime")) {
                    const i = parseInt(h.replace("ImePrezime", ""), 10) - 1;
                    sheet.getRange(matchRow, idx + 1).setValue(members[i] || "");
                }
            });

            return json_({ ok: true, action: "updated", message: "Vaše promjene su spremljene." });
        }

        const newRow = headers.map(h => {
            if (h === "Timestamp") return now;
            if (h && h.toString().startsWith("ImePrezime")) {
                const i = parseInt(h.replace("ImePrezime", ""), 10) - 1;
                return members[i] || "";
            }
            return rowData[h] || "";
        });

        sheet.appendRow(newRow);

        return json_({ ok: true, action: "created", message: "Hvala! Vaš odgovor je zaprimljen." });

    } catch (err) {
        return json_({ ok: false, message: "Greška na serveru.", details: String(err) }, 500);
    }
}

function json_(obj) {
    return ContentService.createTextOutput(JSON.stringify(obj))
        .setMimeType(ContentService.MimeType.JSON);
}

function normalizeEmail_(email) {
    const e = (email || "").toString().trim().toLowerCase();
    return e.includes("@") ? e : "";
}

function normalizePhone_(phone) {
    return (phone || "").toString().trim().replace(/[^\d+]/g, "");
}

function safeJsonParse_(s, fallback) {
    try { return JSON.parse(s || ""); }
    catch { return fallback; }
}
