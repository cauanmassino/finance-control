const apiKey = process.env.GROQ_API_KEY?.trim();

async function main() {
  if (!apiKey) {
    console.error(
      "GROQ_API_KEY não foi encontrada. Confira o arquivo .env.local.",
    );
    process.exitCode = 1;
    return;
  }

  try {
    const response = await fetch(
      "https://api.groq.com/openai/v1/models",
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(15000),
      },
    );

    if (!response.ok) {
      console.error(`Falha na consulta. HTTP ${response.status}.`);

      if (response.status === 401) {
        console.error(
          "A chave não foi aceita. Confira se foi copiada corretamente e se continua válida.",
        );
      } else if (response.status === 403) {
        console.error(
          "O acesso foi negado. Confira as permissões do projeto na Groq.",
        );
      } else if (response.status === 429) {
        console.error(
          "O limite de consultas foi atingido. Aguarde antes de tentar novamente.",
        );
      }

      process.exitCode = 1;
      return;
    }

    const result = await response.json();

    if (!Array.isArray(result.data)) {
      console.error("A Groq retornou uma resposta inesperada.");
      process.exitCode = 1;
      return;
    }

    const models = result.data
      .filter(
        (model) =>
          typeof model?.id === "string" &&
          model.active !== false,
      )
      .map((model) => model.id)
      .sort();

    if (models.length === 0) {
      console.log("Nenhum modelo ativo foi retornado.");
      return;
    }

    console.log(`Modelos retornados: ${models.length}\n`);
    console.log(models.join("\n"));
  } catch {
    console.error(
      "Não foi possível concluir a consulta. Verifique a conexão e tente novamente.",
    );
    process.exitCode = 1;
  }
}

await main();