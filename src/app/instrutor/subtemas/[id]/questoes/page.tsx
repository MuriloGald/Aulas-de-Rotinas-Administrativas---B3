"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Save, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { Question, QuestionOption, Subtheme } from "@/lib/supabase/types";

// Mock para simular banco enquanto não criamos a tabela supabase
const MOCK_QUESTIONS: Record<string, Question[]> = {
  "sbv-p": [
    {
      id: "q1",
      subtheme_id: "sbv-p",
      text: "Qual é a relação correta de compressões para ventilações na RCP em um adulto segundo a AHA?",
      options: [
        { id: "o1", text: "15 compressões para 2 ventilações", isCorrect: false },
        { id: "o2", text: "30 compressões para 2 ventilações", isCorrect: true },
        { id: "o3", text: "30 compressões para 1 ventilação", isCorrect: false },
        { id: "o4", text: "Apenas compressões contínuas", isCorrect: false },
      ],
      explanation: "A proporção universal de RCP para adultos é de 30:2, realizada a uma taxa de 100 a 120 compressões por minuto."
    }
  ]
};

export default function QuestoesSubtemaPage({ params }: { params: { id: string } }) {
  const [subthemeName, setSubthemeName] = useState("Carregando Subtema...");
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Estado para o formulário
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newText, setNewText] = useState("");
  const [newOptions, setNewOptions] = useState<QuestionOption[]>([]);
  const [newExplanation, setNewExplanation] = useState("");

  useEffect(() => {
    // Busca nome mockado do subtema (apenas para visual)
    setSubthemeName(`Subtema: ${params.id.toUpperCase()}`);
    
    // Carrega questões mockadas
    if (MOCK_QUESTIONS[params.id]) {
      setQuestions(MOCK_QUESTIONS[params.id]);
    }
  }, [params.id]);

  const handleAddNewOption = () => {
    setNewOptions([
      ...newOptions, 
      { id: Date.now().toString(), text: "", isCorrect: false }
    ]);
  };

  const handleUpdateOption = (id: string, text: string) => {
    setNewOptions(newOptions.map(o => o.id === id ? { ...o, text } : o));
  };

  const handleSetCorrectOption = (id: string) => {
    setNewOptions(newOptions.map(o => ({ ...o, isCorrect: o.id === id })));
  };

  const handleRemoveOption = (id: string) => {
    setNewOptions(newOptions.filter(o => o.id !== id));
  };

  const handleSaveQuestion = () => {
    if (!newText.trim() || newOptions.length < 2) {
      alert("A questão precisa de um enunciado e pelo menos duas opções.");
      return;
    }
    if (!newOptions.some(o => o.isCorrect)) {
      alert("Selecione pelo menos uma opção correta.");
      return;
    }

    const questionToSave: Question = {
      id: editingId || Date.now().toString(),
      subtheme_id: params.id,
      text: newText,
      options: newOptions,
      explanation: newExplanation
    };

    if (editingId) {
      setQuestions(questions.map(q => q.id === editingId ? questionToSave : q));
    } else {
      setQuestions([...questions, questionToSave]);
    }

    resetForm();
  };

  const handleDeleteQuestion = (id: string) => {
    if(confirm("Tem certeza que deseja remover esta questão?")) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const handleEditQuestion = (q: Question) => {
    setEditingId(q.id);
    setNewText(q.text);
    setNewOptions([...q.options]);
    setNewExplanation(q.explanation || "");
    setIsAdding(true);
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setNewText("");
    setNewOptions([
      { id: "1", text: "", isCorrect: false },
      { id: "2", text: "", isCorrect: false }
    ]);
    setNewExplanation("");
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link 
            href="/instrutor/subtemas" 
            className="p-2 rounded-lg bg-surface border border-border hover:border-primary/50 text-muted-foreground hover:text-foreground transition-all"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Banco de Questões</h1>
            <p className="text-sm text-muted-foreground">{subthemeName}</p>
          </div>
        </div>
        {!isAdding && (
          <button
            onClick={() => { resetForm(); setIsAdding(true); }}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-primary text-white font-bold text-sm hover:bg-primary-hover transition-colors shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Nova Questão
          </button>
        )}
      </div>

      {/* Editor Form */}
      {isAdding && (
        <div className="bg-card border border-primary/30 rounded-2xl p-6 shadow-lg shadow-primary/5 animate-scale-in">
          <h2 className="text-lg font-bold text-foreground mb-4">{editingId ? "Editar Questão" : "Criar Nova Questão"}</h2>
          
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-foreground">Enunciado da Questão</label>
              <textarea
                value={newText}
                onChange={e => setNewText(e.target.value)}
                placeholder="Ex: Qual é a função do extintor de CO2?"
                className="w-full h-24 p-3 rounded-lg bg-surface border border-border text-sm text-foreground focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Alternativas (Selecione a correta no botão lateral)</label>
              <div className="space-y-2">
                {newOptions.map((opt, i) => (
                  <div key={opt.id} className="flex items-center gap-2">
                    <button
                      onClick={() => handleSetCorrectOption(opt.id)}
                      className={`w-8 h-8 flex items-center justify-center rounded-lg border flex-shrink-0 transition-colors ${opt.isCorrect ? 'bg-success/20 border-success text-success' : 'bg-surface border-border text-muted-foreground hover:border-primary'}`}
                      title="Marcar como correta"
                    >
                      {opt.isCorrect ? <CheckCircle2 className="w-5 h-5" /> : <span className="text-xs font-bold">{String.fromCharCode(65 + i)}</span>}
                    </button>
                    <input
                      type="text"
                      value={opt.text}
                      onChange={e => handleUpdateOption(opt.id, e.target.value)}
                      placeholder={`Alternativa ${String.fromCharCode(65 + i)}`}
                      className={`flex-1 h-10 px-3 rounded-lg bg-surface border text-sm focus:outline-none focus:border-primary ${opt.isCorrect ? 'border-success/50' : 'border-border'}`}
                    />
                    <button
                      onClick={() => handleRemoveOption(opt.id)}
                      className="p-2 text-muted-foreground hover:text-rose-500 transition-colors"
                      title="Remover alternativa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={handleAddNewOption}
                className="text-xs font-bold text-primary hover:text-primary-hover flex items-center gap-1 mt-2"
              >
                <Plus className="w-3 h-3" /> Adicionar Alternativa
              </button>
            </div>

            <div className="space-y-1 pt-4 border-t border-border">
              <label className="text-xs font-semibold text-foreground flex items-center gap-2">
                Explicação da Resposta <span className="text-[10px] text-muted-foreground font-normal">(Opcional)</span>
              </label>
              <textarea
                value={newExplanation}
                onChange={e => setNewExplanation(e.target.value)}
                placeholder="Explique o motivo desta resposta ser a correta para ajudar no aprendizado do aluno..."
                className="w-full h-16 p-3 rounded-lg bg-surface border border-border text-xs text-foreground focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={resetForm}
                className="px-4 py-2 rounded-lg bg-surface border border-border text-sm font-semibold hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveQuestion}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-white text-sm font-bold hover:bg-primary-hover transition-colors"
              >
                <Save className="w-4 h-4" />
                Salvar Questão
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Questions List */}
      <div className="space-y-4">
        {questions.length === 0 && !isAdding ? (
          <div className="bg-card border border-border rounded-xl p-10 text-center flex flex-col items-center">
            <AlertCircle className="w-10 h-10 text-muted-foreground mb-3 opacity-50" />
            <p className="text-muted-foreground font-medium">Nenhuma questão cadastrada para este subtema.</p>
            <p className="text-xs text-muted-foreground mt-1">Crie questões para habilitar a Prova de Aprendizagem via QR Code.</p>
          </div>
        ) : (
          questions.map((q, idx) => (
            <div key={q.id} className="bg-card border border-border rounded-xl p-5 hover:border-primary/30 transition-colors group relative">
              <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => handleEditQuestion(q)} className="p-1.5 rounded bg-surface border border-border hover:text-primary transition-colors text-muted-foreground">
                  Editar
                </button>
                <button onClick={() => handleDeleteQuestion(q.id)} className="p-1.5 rounded bg-surface border border-border hover:text-rose-500 transition-colors text-muted-foreground">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                  {idx + 1}
                </div>
                <div className="flex-1 space-y-3 pt-1">
                  <p className="text-sm font-bold text-foreground leading-relaxed pr-20">{q.text}</p>
                  
                  <div className="space-y-1.5">
                    {q.options.map((opt, oIdx) => (
                      <div key={opt.id} className={`flex items-start gap-2 p-2 rounded-lg text-xs ${opt.isCorrect ? 'bg-success/10 border border-success/20 text-success-foreground' : 'bg-surface text-muted-foreground'}`}>
                        <span className={`font-bold mt-0.5 ${opt.isCorrect ? 'text-success' : ''}`}>{String.fromCharCode(65 + oIdx)}.</span>
                        <span className={opt.isCorrect ? 'font-semibold' : ''}>{opt.text}</span>
                        {opt.isCorrect && <CheckCircle2 className="w-3.5 h-3.5 text-success ml-auto mt-0.5" />}
                      </div>
                    ))}
                  </div>

                  {q.explanation && (
                    <div className="mt-3 p-3 bg-accent/5 border-l-2 border-accent text-xs text-muted-foreground rounded-r-lg italic">
                      <span className="font-semibold text-accent not-italic">Explicação: </span>{q.explanation}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
