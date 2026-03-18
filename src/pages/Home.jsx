import XlsxToJson from "../components/XlsxToJson";

const Home = () => {
  return (
    <div className="page-shell">
      <section className="page-hero">
        <h1>MovLinhas</h1>
        <p>
          Ferramenta para converter planilhas em TXT com layout fixo e também
          editar arquivos TXT removendo linhas específicas de forma rápida.
        </p>
      </section>

      <XlsxToJson />
    </div>
  );
};

export default Home;
