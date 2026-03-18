import * as xlsx from 'xlsx';
import * as React from 'react';

const XlsxToJson = () => {
  const [json, setJson] = React.useState([]);
  const [selectedOption, setSelectedOption] = React.useState('Pagto minimo cartao');
  const [txtContent, setTxtContent] = React.useState('');
  const [linesToDelete, setLinesToDelete] = React.useState('');

  const newDate = new Date();
  const day = String(newDate.getDate()).padStart(2, '0');
  const month = String(newDate.getMonth() + 1).padStart(2, '0');
  const year = newDate.getFullYear();

  const StrictNumberChars = (str, number) => {
    while (str.length > number) {
      str = str.slice(0, -1);
    }
    for (let i = str.length; i <= number; ++i) {
      str += ' ';
    }
    return str;
  };

  const FormatValue = (value) => {
    let floatValue = parseFloat(value).toFixed(2);
    let stringValue = floatValue.replace('.', '');
    return stringValue.padStart(17, '0');
  };

  const AddZeros = (value, number) => {
    let stringValue = value.toString();
    return stringValue.padStart(number, '0');
  };

  const readUploadXlsxFile = (e) => {
    e.preventDefault();
    if (e.target.files) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = e.target.result;
        const workbook = xlsx.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        let jsonReturn = xlsx.utils.sheet_to_json(worksheet);
        setJson(jsonReturn);
      };
      reader.readAsArrayBuffer(e.target.files[0]);
    }
  };

  const saveXlsxToTxt = () => {
    if (!json.length) {
      console.error("JSON está vazio ou não foi carregado corretamente.");
      return;
    }
  
    // Gerando o conteúdo a partir do JSON
    const content = [
      StrictNumberChars(`0175643810000000NOMEEMPRES0903${year}${month}${day}`, 199), // Header
      ...json.map(item => {
        // Verifica se os campos estão definidos, caso contrário usa um valor padrão
        const contaCapital = item.ContaCapital ? AddZeros(item.ContaCapital, 9) : AddZeros('', 9);
        const nomeCliente = item.NomeCliente ? RemoverAcentos(item.NomeCliente) : '';
        const endereco = item.Endereco ? StrictNumberChars(item.Endereco, 47) : StrictNumberChars('', 47);
        const valorIntegralizacao = item.ValorIntegralizaçãoFolha ? FormatValue(item.ValorIntegralizaçãoFolha) : FormatValue(0);
  
        return StrictNumberChars(`1D${contaCapital}${nomeCliente}`, 47)
          + '    '
          + '00000000000000            '
          + AddZeros(contaCapital, 12)
          + '                    '
          + valorIntegralizacao
          + ' '.repeat(14)
          + selectedOption
          + ' '.repeat(39) // Preenche até completar 199 caracteres por linha
          + endereco;
      }),
      // Footer com verificações
      StrictNumberChars(
        `9${AddZeros(json[0]?.TotalLinhas || '0', 4)}${FormatValue(json[0]?.ValorTotal?.toFixed(2) || '0')}`,
        199
      ), // Footer
    ].join('\n');
  
    // Criando o arquivo
    const element = document.createElement('a');
    const file = new Blob([content], { type: 'text/plain' });
    const fileURL = URL.createObjectURL(file);
  
    element.href = fileURL;
    element.download = 'xlsx_converted_to_txt.txt';
  
    // Adicionando o elemento ao DOM, disparando o clique, e removendo
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  
    // Liberar o objeto URL da memória
    URL.revokeObjectURL(fileURL);
  
    console.log("Arquivo baixado com sucesso.");
  };
  

  const handleTxtFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTxtContent(e.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleDeleteLines = () => {
    if (!linesToDelete || !txtContent) return;

    const linesArray = linesToDelete.split(',').map(line => parseInt(line.trim()) - 1);
    const lines = txtContent.split('\n');
    const updatedLines = lines.filter((_, index) => !linesArray.includes(index));
    setTxtContent(updatedLines.join('\n'));
  };

  const saveUpdatedTxt = () => {
    const element = document.createElement('a');
    const file = new Blob([txtContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = 'updated_file.txt';
    document.body.appendChild(element);
    element.click();
  };

  return (
    <div className="tool-grid">
      <section className="tool-card converter-card">
        <h2>Converter planilha em TXT</h2>
        <p className="section-description">
          Envie um arquivo XLSX, escolha o tipo de operação e gere o TXT já no
          formato esperado.
        </p>

        <form>
          <div className="input-stack">
            <div>
              <label htmlFor="uploadXlsx">Selecione um arquivo .xlsx</label>
              <input type="file" name="uploadXlsx" id="uploadXlsx" onChange={readUploadXlsxFile} />
            </div>

            <div>
              <label htmlFor="option">Escolha uma opção</label>
              <select id="option" value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)}>
                <option value="Pagto minimo cartao">Pagto minimo cartao</option>
                <option value="Pgt.Parc.Emprestimo">Pgt.Parc.Emprestimo</option>
              </select>
            </div>
          </div>
        </form>

        {json.length > 0 && (
          <div className="preview-block">
            <div className="preview-actions preview-actions-top">
              <p className="preview-note">
                Arquivo carregado. Você já pode salvar o TXT sem precisar rolar até o fim da prévia.
              </p>
              <div className="button-row">
                <button onClick={saveXlsxToTxt}>Salvar XLSX convertido para TXT</button>
              </div>
            </div>

            <div className="preview-header-row">
              <p className="preview-title">Prévia do conteúdo gerado</p>
              <span className="preview-badge">{json.length} linhas carregadas</span>
            </div>

            <div className="preview-shell">
              <div className="preview-scroll">
                <pre>
                  {StrictNumberChars(`0175643810000000NOMEEMPRES0903${year}${month}${day}`, 199)}

                  {json.map((item, index) => (
                    <div className="preview-line" key={index}>
                      {StrictNumberChars(`1D${AddZeros(item.ContaCapital, 9)}${RemoverAcentos(item.NomeCliente)}`, 47)}
                      {' '}
                      {AddZeros(`${item.ContaCapital}`, 12)}
                      {' '}
                      {FormatValue(`${item.ValorIntegralizaçãoFolha}`)}
                      {' '}
                      {selectedOption}
                    </div>
                  ))}

                  {StrictNumberChars(`9${AddZeros(json[0]?.TotalLinhas || 0, 4)}${FormatValue(json[0]?.ValorTotal?.toFixed(2) || 0).padEnd(38, '0')}`, 199)}
                </pre>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="tool-card tool-card--txt">
        <h2>Remover linhas de um TXT</h2>
        <p className="section-description">
          Abra um arquivo TXT, informe os números das linhas e salve a versão já
          ajustada.
        </p>

        <div className="input-stack">
          <div>
            <label htmlFor="uploadTxt">Selecione um arquivo .txt</label>
            <input id="uploadTxt" type="file" accept=".txt" onChange={handleTxtFileChange} />
          </div>

          <div>
            <label htmlFor="txtPreview">Conteúdo do arquivo</label>
            <textarea
              id="txtPreview"
              value={txtContent}
              readOnly
              rows={10}
              cols={80}
              placeholder="O conteúdo do arquivo .txt aparecerá aqui"
            />
          </div>

          <div>
            <label htmlFor="linesToDelete">Linhas a serem apagadas</label>
            <input
              type="text"
              id="linesToDelete"
              value={linesToDelete}
              onChange={(e) => setLinesToDelete(e.target.value)}
              placeholder="Exemplo: 1, 3, 5"
            />
            <p className="helper-text">
              Separe os números por vírgula para remover múltiplas linhas.
            </p>
          </div>
        </div>

        <div className="button-row">
          <button onClick={handleDeleteLines}>Apagar linhas</button>
          <button onClick={saveUpdatedTxt}>Salvar arquivo TXT</button>
        </div>
      </section>
    </div>
  );
};

export default XlsxToJson;

function RemoverAcentos(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}
