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
    <div>
      {/* Seção para upload e conversão de arquivos XLSX */}
      <section style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ccc' }}>
        <h2>Movimento de Terceiro C/C Deb.</h2>
        <form>
          <label htmlFor="uploadXlsx">Selecione um arquivo .xlsx:</label>
          <input type="file" name="uploadXlsx" id="uploadXlsx" onChange={readUploadXlsxFile} />
          
          <label htmlFor="option">Escolha uma opção: </label>
          <select id="option" value={selectedOption} onChange={(e) => setSelectedOption(e.target.value)}>
            <option value="Pagto minimo cartao">Pagto minimo cartao</option>
            <option value="Pgt.Parc.Emprestimo">Pgt.Parc.Emprestimo</option>
          </select>
        </form>

        {json.length > 0 && (
          <div>
            <h3>Resultado</h3>
            <pre>
              {StrictNumberChars(`0175643810000000NOMEEMPRES0903${year}${month}${day}`, 199)}

              {json.map((item, index) => (
                <div key={index}>
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
            <button onClick={saveXlsxToTxt}>Salvar XLSX Convertido para TXT</button>
          </div>
        )}
      </section>

      {/* Seção para manipulação de arquivo TXT */}
      <section style={{ padding: '20px', border: '1px solid #ccc' }}>
        <h2>Apagar Linhas de um Arquivo TXT</h2>
        <input type="file" accept=".txt" onChange={handleTxtFileChange} />
        <textarea
          value={txtContent}
          readOnly
          rows={10}
          cols={80}
          placeholder="O conteúdo do arquivo .txt aparecerá aqui"
        />
        <div>
          <label htmlFor="linesToDelete">Linhas a serem apagadas (separadas por vírgula):</label>
          <input
            type="text"
            id="linesToDelete"
            value={linesToDelete}
            onChange={(e) => setLinesToDelete(e.target.value)}
            placeholder="Exemplo: 1, 3, 5"
          />
          <button onClick={handleDeleteLines}>Apagar Linhas</button>
          <button onClick={saveUpdatedTxt}>Salvar Arquivo .txt</button>
        </div>
      </section>
    </div>
  );
};

export default XlsxToJson;

function RemoverAcentos(texto) {
  return texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}


const saveXlsxToTxt = () => {
  const content = "Teste de download do arquivo TXT.";
  const element = document.createElement('a');
  const file = new Blob([content], { type: 'text/plain' });
  const fileURL = URL.createObjectURL(file);
  
  element.href = fileURL;
  element.download = 'test_file.txt';
  
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
  
  URL.revokeObjectURL(fileURL);
};
