from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from datetime import datetime
import json
import io

class ReportService:
    def __init__(self):
        self.styles = getSampleStyleSheet()
        
    def generate_prediction_report(self, user, prediction, include_history=False):
        """Generate PDF report for prediction"""
        try:
            buffer = io.BytesIO()
            
            def draw_page_frame(canvas, doc):
                # Draw elegant page border
                canvas.setStrokeColor(colors.HexColor('#e5e7eb'))
                canvas.setLineWidth(1)
                canvas.rect(0.6*inch, 0.6*inch, A4[0]-1.2*inch, A4[1]-1.2*inch)
                
                # Add subtle corner accents
                canvas.setStrokeColor(colors.HexColor('#0ea5e9'))
                canvas.setLineWidth(2)
                # Top left corner
                canvas.line(0.6*inch, A4[1]-0.6*inch, 0.8*inch, A4[1]-0.6*inch)
                canvas.line(0.6*inch, A4[1]-0.6*inch, 0.6*inch, A4[1]-0.8*inch)
                # Top right corner
                canvas.line(A4[0]-0.8*inch, A4[1]-0.6*inch, A4[0]-0.6*inch, A4[1]-0.6*inch)
                canvas.line(A4[0]-0.6*inch, A4[1]-0.6*inch, A4[0]-0.6*inch, A4[1]-0.8*inch)
                # Bottom left corner
                canvas.line(0.6*inch, 0.6*inch, 0.8*inch, 0.6*inch)
                canvas.line(0.6*inch, 0.6*inch, 0.6*inch, 0.8*inch)
                # Bottom right corner
                canvas.line(A4[0]-0.8*inch, 0.6*inch, A4[0]-0.6*inch, 0.6*inch)
                canvas.line(A4[0]-0.6*inch, 0.6*inch, A4[0]-0.6*inch, 0.8*inch)
            
            doc = SimpleDocTemplate(
                buffer, 
                pagesize=A4,
                leftMargin=0.9*inch,
                rightMargin=0.9*inch,
                topMargin=0.9*inch,
                bottomMargin=0.9*inch
            )
            
            story = []
            
            # Parse data
            result = json.loads(prediction.result)
            input_data = json.loads(prediction.input_data)
            print(f"PDF DEBUG: raw input_data = {input_data}")
            
            # Header without box
            clinic_style = ParagraphStyle(
                'Clinic',
                parent=self.styles['Normal'],
                fontSize=18,
                textColor=colors.HexColor('#0ea5e9'),
                alignment=1,
                fontName='Helvetica-Bold',
                spaceAfter=5
            )
            story.append(Paragraph("MEDPREDICT AI CLINIC", clinic_style))
            story.append(Spacer(1, 10))
            
            # Tagline
            tagline_style = ParagraphStyle(
                'Tagline',
                parent=self.styles['Normal'],
                fontSize=10,
                textColor=colors.black,
                alignment=1,
                spaceAfter=30
            )
            story.append(Paragraph('"Leading AI Health Predictions"', tagline_style))
            
            # Date
            date_style = ParagraphStyle(
                'Date',
                parent=self.styles['Normal'],
                fontSize=10,
                textColor=colors.black,
                alignment=2,
                spaceAfter=20
            )
            story.append(Paragraph(f"Date: {datetime.now().strftime('%B %d, %Y')}", date_style))
            
            # Patient Information Header with underline
            section_style = ParagraphStyle(
                'SectionHeader',
                parent=self.styles['Normal'],
                fontSize=14,
                textColor=colors.HexColor('#0ea5e9'),
                alignment=1,
                fontName='Helvetica-Bold',
                spaceAfter=5
            )
            story.append(Paragraph("Patient Information", section_style))
            
            # Add decorative line under section header
            line_table = Table([['']], colWidths=[6.5*inch])
            line_table.setStyle(TableStyle([
                ('LINEBELOW', (0, 0), (-1, -1), 2, colors.HexColor('#0ea5e9')),
                ('TOPPADDING', (0, 0), (-1, -1), 0),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 0),
            ]))
            story.append(line_table)
            story.append(Spacer(1, 10))
            
            # Patient Information Table
            print(f"PDF DEBUG: input_data keys = {list(input_data.keys())}")
            print(f"PDF DEBUG: patient_name = {input_data.get('patient_name')}")
            print(f"PDF DEBUG: patientName = {input_data.get('patientName')}")
            print(f"PDF DEBUG: username = {user.username}")
            patient_name = input_data.get('patient_name') or input_data.get('patientName') or user.username
            print(f"PDF DEBUG: final patient_name = {patient_name}")
            patient_data = [
                ['Patient Name:', patient_name, 'Gender:', 'Male' if input_data.get('sex') == 1 else 'Female'],
                ['Email:', user.email, 'Age:', f"{input_data.get('age', 'N/A')} years"],
                ['Chest Pain:', ['Typical Angina', 'Atypical Angina', 'Non-anginal', 'Asymptomatic'][input_data.get('cp', 0)] if input_data.get('cp') is not None else 'N/A', 'Blood Pressure:', f"{input_data.get('trestbps', 'N/A')} mmHg"],
                ['Cholesterol:', f"{input_data.get('chol', 'N/A')} mg/dl", 'Max Heart Rate:', f"{input_data.get('thalach', 'N/A')} bpm"],
                ['Fasting Sugar >120:', 'Yes' if input_data.get('fbs') == 1 else 'No', 'Resting ECG:', ['Normal', 'ST-T abnormality', 'LV hypertrophy'][input_data.get('restecg', 0)] if input_data.get('restecg') is not None else 'N/A'],
                ['Exercise Angina:', 'Yes' if input_data.get('exang') == 1 else 'No', 'ST Depression:', str(input_data.get('oldpeak', 'N/A'))],
                ['ST Slope:', ['Downsloping', 'Flat', 'Upsloping'][input_data.get('slope', 0)] if input_data.get('slope') is not None else 'N/A', 'Major Vessels:', str(input_data.get('ca', 'N/A'))],
                ['Thalassemia:', ['', 'Fixed Defect', 'Normal', 'Reversible Defect'][input_data.get('thal', 2)] if input_data.get('thal') is not None else 'N/A', '', '']
            ]
            
            patient_table = Table(patient_data, colWidths=[1.5*inch, 2.0*inch, 1.5*inch, 2.0*inch])
            patient_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (2, 0), (2, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 5),
                ('RIGHTPADDING', (0, 0), (-1, -1), 5),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
                ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#f8fafc')]),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#e5e7eb')),
            ]))
            story.append(patient_table)
            story.append(Spacer(1, 30))
            
            # AI Analysis Report Header with underline
            story.append(Paragraph("AI Analysis Report", section_style))
            story.append(line_table)
            story.append(Spacer(1, 10))
            
            # Analysis text - recalculate risk category with updated logic
            confidence_score = float(result['confidence_score'])
            print(f"REPORT DEBUG: confidence_score = {confidence_score}")
            
            if confidence_score >= 0.75:
                risk_level = 'HIGH'
            elif confidence_score >= 0.5:
                risk_level = 'MODERATE'
            else:
                risk_level = 'LOW'
                
            print(f"REPORT DEBUG: risk_level = {risk_level}")
            confidence = confidence_score * 100
            
            analysis_text = f"Based on the comprehensive analysis of the provided medical parameters, our AI system has evaluated the cardiovascular risk profile. The patient has been assessed with a {risk_level} RISK classification for heart disease with a confidence level of {confidence:.1f}%. This assessment was generated using our advanced machine learning model: {result.get('model_used', 'Heart Disease Prediction Model')}. For the patient's comprehensive health management, please refer to the recommendations provided below."
            
            # Analysis text without box
            analysis_style = ParagraphStyle(
                'Analysis',
                parent=self.styles['Normal'],
                fontSize=10,
                textColor=colors.black,
                alignment=4,
                spaceAfter=10,
                leading=15
            )
            story.append(Paragraph(analysis_text, analysis_style))
            story.append(Spacer(1, 30))
            
            # AI Recommendations Header with underline
            story.append(Paragraph("AI Recommendations", section_style))
            story.append(line_table)
            story.append(Spacer(1, 10))
            
            # Recommendations - use recalculated risk level
            recommendations = self._get_recommendations(risk_level.lower())
            
            # Recommendations in a styled box
            rec_data = []
            for i, rec in enumerate(recommendations[:4], 1):
                rec_data.append([f"{i}.", rec])
            
            rec_table = Table(rec_data, colWidths=[0.3*inch, 6.2*inch])
            rec_table.setStyle(TableStyle([
                ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, -1), 10),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('LEFTPADDING', (0, 0), (-1, -1), 10),
                ('RIGHTPADDING', (0, 0), (-1, -1), 10),
                ('TOPPADDING', (0, 0), (-1, -1), 8),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f0f9ff')),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#bfdbfe')),
            ]))
            story.append(rec_table)
            
            doc.build(story, onFirstPage=draw_page_frame, onLaterPages=draw_page_frame)
            buffer.seek(0)
            return buffer
            
        except Exception as e:
            # Return simple error PDF if generation fails
            buffer = io.BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=A4)
            story = [Paragraph(f"Error generating report: {str(e)}", self.styles['Normal'])]
            doc.build(story)
            buffer.seek(0)
            return buffer

    def _get_recommendations(self, risk_level):
        recommendations = {
            'Low': [
                "Maintain healthy lifestyle with regular physical activity (30 min daily)",
                "Follow heart-healthy diet with fruits, vegetables, whole grains",
                "Schedule annual health checkups and cardiovascular screenings",
                "Monitor blood pressure and cholesterol levels every 3-6 months"
            ],
            'Medium': [
                "Schedule healthcare provider appointment within 1-2 weeks",
                "Implement lifestyle modifications with dietary changes and exercise",
                "Monitor cardiovascular symptoms and maintain daily health diary",
                "Follow up with health screenings every 3-4 months"
            ],
            'High': [
                "Seek immediate medical attention and cardiology consultation",
                "Undergo comprehensive cardiac evaluation (ECG, echo, stress tests)",
                "Follow all prescribed treatment plans and medications strictly",
                "Implement intensive lifestyle changes under medical supervision"
            ]
        }
        
        risk_mapping = {
            'low': 'Low',
            'medium': 'Medium', 
            'moderate': 'Medium',
            'high': 'High'
        }
        
        standard_risk = risk_mapping.get(risk_level.lower() if risk_level else '', 'Medium')
        return recommendations.get(standard_risk, ["Consult with a healthcare provider immediately"])

# Global instance
report_service = ReportService()