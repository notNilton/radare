package handlers

import (
	"bytes"
	"fmt"
	"strings"
)

const (
	pdfPageWidth  = 595
	pdfPageHeight = 842
	pdfMarginLeft = 40
	pdfTop        = 800
	pdfLineHeight = 14
)

func buildSimplePDF(lines []string) []byte {
	chunks := chunkLines(lines, maxLinesPerPage())
	if len(chunks) == 0 {
		chunks = [][]string{{"Sem registros."}}
	}

	pageCount := len(chunks)
	firstPageID := 3
	fontID := firstPageID + pageCount*2
	totalObjects := fontID

	var buf bytes.Buffer
	buf.WriteString("%PDF-1.4\n")

	offsets := make([]int, totalObjects+1)
	writeObj := func(id int, body string) {
		offsets[id] = buf.Len()
		fmt.Fprintf(&buf, "%d 0 obj\n%s\nendobj\n", id, body)
	}

	writeObj(1, "<< /Type /Catalog /Pages 2 0 R >>")

	kids := make([]string, 0, pageCount)
	for i := 0; i < pageCount; i++ {
		pageID := firstPageID + i*2
		kids = append(kids, fmt.Sprintf("%d 0 R", pageID))
	}
	writeObj(2, fmt.Sprintf("<< /Type /Pages /Kids [%s] /Count %d >>", strings.Join(kids, " "), pageCount))

	for i, chunk := range chunks {
		pageID := firstPageID + i*2
		contentID := pageID + 1

		pageBody := fmt.Sprintf("<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %d %d] /Resources << /Font << /F1 %d 0 R >> >> /Contents %d 0 R >>",
			pdfPageWidth,
			pdfPageHeight,
			fontID,
			contentID,
		)
		writeObj(pageID, pageBody)

		content := buildPDFContent(chunk)
		writeObj(contentID, fmt.Sprintf("<< /Length %d >>\nstream\n%s\nendstream", len(content), content))
	}

	writeObj(fontID, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")

	startXref := buf.Len()
	fmt.Fprintf(&buf, "xref\n0 %d\n", totalObjects+1)
	fmt.Fprint(&buf, "0000000000 65535 f \n")
	for i := 1; i <= totalObjects; i++ {
		fmt.Fprintf(&buf, "%010d 00000 n \n", offsets[i])
	}

	fmt.Fprintf(&buf, "trailer\n<< /Size %d /Root 1 0 R >>\n", totalObjects+1)
	fmt.Fprintf(&buf, "startxref\n%d\n%%EOF\n", startXref)

	return buf.Bytes()
}

func buildPDFContent(lines []string) string {
	var builder strings.Builder
	builder.WriteString("BT\n/F1 10 Tf\n")
	builder.WriteString(fmt.Sprintf("%d TL\n", pdfLineHeight))
	builder.WriteString(fmt.Sprintf("%d %d Td\n", pdfMarginLeft, pdfTop))

	for i, line := range lines {
		if i > 0 {
			builder.WriteString("T*\n")
		}
		builder.WriteString("(")
		builder.WriteString(pdfEscape(line))
		builder.WriteString(") Tj\n")
	}

	builder.WriteString("ET\n")
	return builder.String()
}

func pdfEscape(text string) string {
	text = strings.ReplaceAll(text, "\\", "\\\\")
	text = strings.ReplaceAll(text, "(", "\\(")
	text = strings.ReplaceAll(text, ")", "\\)")
	return text
}

func maxLinesPerPage() int {
	return (pdfTop / pdfLineHeight) - 2
}

func chunkLines(lines []string, maxPerPage int) [][]string {
	if maxPerPage <= 0 {
		return nil
	}
	if len(lines) == 0 {
		return nil
	}

	var chunks [][]string
	for start := 0; start < len(lines); start += maxPerPage {
		end := start + maxPerPage
		if end > len(lines) {
			end = len(lines)
		}
		chunks = append(chunks, lines[start:end])
	}
	return chunks
}

func wrapLine(line string, limit int) []string {
	if limit <= 0 || len(line) <= limit {
		return []string{line}
	}

	words := strings.Fields(line)
	if len(words) == 0 {
		return []string{line}
	}

	var result []string
	var current strings.Builder
	for _, word := range words {
		if current.Len() == 0 {
			current.WriteString(word)
			continue
		}
		if current.Len()+1+len(word) > limit {
			result = append(result, current.String())
			current.Reset()
			current.WriteString(word)
			continue
		}
		current.WriteString(" ")
		current.WriteString(word)
	}
	if current.Len() > 0 {
		result = append(result, current.String())
	}

	return result
}
