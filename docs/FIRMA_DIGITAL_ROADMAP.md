# 🔏 Firma Digital - Roadmap de Desarrollo

## Estado Actual (v1.0)
✅ Implementado el 18/01/2026

### Funcionalidades Completadas:
1. **Creación de documentos** con Rich Text o PDF externo
2. **Multi-firmantes** con flujo secuencial o paralelo
3. **Posicionamiento de firmas** por el creador del documento (paso 3 del wizard)
4. **Captura de firma** mediante:
   - Dibujo en canvas táctil
   - Texto con múltiples fuentes cursivas
   - Firmas guardadas reutilizables (localStorage)
5. **Hash SHA-256** para integridad del documento
6. **Descarga PNG** del documento con firmas visuales integradas
7. **Vista previa de PDF** en iframe durante posicionamiento

---

## Fase 2: PDF con Firmas Embebidas (Pendiente)

### Objetivo
Generar un **PDF real** con las firmas insertadas directamente en el documento, no solo una imagen PNG.

### Tecnología Requerida
```bash
npm install pdf-lib
```

### Implementación Propuesta

#### 1. Modificar `useSignatures.ts`
```typescript
import { PDFDocument, rgb } from 'pdf-lib';

async function embedSignaturesIntoPdf(doc: SignatureDocument): Promise<string> {
  let pdfDoc: PDFDocument;
  
  if (doc.origin === 'Externo_PDF' && doc.fileUrl) {
    // Cargar PDF existente
    const existingPdfBytes = await fetch(doc.fileUrl).then(res => res.arrayBuffer());
    pdfDoc = await PDFDocument.load(existingPdfBytes);
  } else {
    // Crear PDF desde Rich Text
    pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([612, 792]); // Letter size
    
    // Agregar contenido
    page.drawText(doc.title, {
      x: 50,
      y: 750,
      size: 24,
      color: rgb(0.1, 0.1, 0.1)
    });
    
    // Word-wrap del contenido...
    // (implementar lógica de texto multilínea)
  }
  
  // Insertar firmas en sus posiciones
  for (const signer of doc.signers) {
    if (signer.status === 'Firmado' && signer.signatureData) {
      const signatureImage = await pdfDoc.embedPng(signer.signatureData);
      const page = pdfDoc.getPage(0); // O la página correcta según position
      
      const { width, height } = page.getSize();
      const sigX = (signer.position?.x || 50) / 100 * width;
      const sigY = height - ((signer.position?.y || 80) / 100 * height);
      
      page.drawImage(signatureImage, {
        x: sigX,
        y: sigY,
        width: 150,
        height: 50
      });
      
      // Agregar nombre y fecha debajo
      page.drawText(signer.fullName, {
        x: sigX,
        y: sigY - 15,
        size: 8,
        color: rgb(0.3, 0.3, 0.3)
      });
    }
  }
  
  // Agregar footer con hash
  const pages = pdfDoc.getPages();
  pages.forEach(page => {
    page.drawText(`SHA-256: ${doc.hashOriginal}`, {
      x: 50,
      y: 30,
      size: 6,
      color: rgb(0.6, 0.6, 0.6)
    });
  });
  
  // Guardar y retornar como base64 o blob URL
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}
```

#### 2. Actualizar `SignatureDocument` en types.ts
```typescript
interface SignatureDocument {
  // ... campos existentes ...
  finalPdfUrl?: string;        // URL del PDF con firmas embebidas
  finalPdfGeneratedAt?: Date;  // Cuándo se generó
}
```

#### 3. Modificar `DocumentDetail` para mostrar PDF final
```tsx
// Si existe finalPdfUrl, mostrar iframe con el PDF
{doc.finalPdfUrl && (
  <iframe 
    src={doc.finalPdfUrl} 
    className="w-full h-[800px] border rounded-xl"
  />
)}

// Botón de descarga apunta al PDF real
<a href={doc.finalPdfUrl} download={`${doc.title}_firmado.pdf`}>
  Descargar PDF Firmado
</a>
```

#### 4. Flujo de generación
1. Cuando **todos los firmantes** completan su firma
2. El sistema automáticamente:
   - Llama `embedSignaturesIntoPdf(doc)`
   - Sube el PDF resultante a Firebase Storage
   - Guarda `finalPdfUrl` en Firestore
3. El documento pasa a estado `Firmado`

### Consideraciones de Storage
- Los PDFs con firmas pueden pesar varios MB
- Usar Firebase Storage con reglas de acceso apropiadas
- Considerar limpieza de PDFs temporales después de X días

### Alternativa: Servicio Externo
Para firmas legalmente válidas, considerar integración con:
- DocuSign
- HelloSign  
- SignNow
- Adobe Sign

Estos servicios ofrecen:
- Firma electrónica certificada
- Cumplimiento normativo
- Auditoría y trazabilidad legal

---

## Notas Técnicas
- La posición de firma se guarda como `{ x: number, y: number }` en porcentaje
- Los PDFs se renderizan en iframe durante el posicionamiento
- pdf-lib soporta PNG embebido directamente desde base64

## Referencias
- [pdf-lib Documentation](https://pdf-lib.js.org/)
- [Mozilla PDF.js](https://mozilla.github.io/pdf.js/) para renderizado
