#!/usr/bin/env node

/**
 * Script de Automação de Deploy - RegiFlex
 * 
 * Este script automatiza o processo de deploy de novas instâncias
 * do RegiFlex para cada cliente, criando subdomínios isolados.
 * 
 * Uso:
 * node scripts/deploy-automation.js --clinic-id=123 --subdomain=clinica-exemplo
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class DeployAutomation {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..')
    this.templateDir = path.join(this.projectRoot, 'frontend')
    this.deploysDir = path.join(this.projectRoot, 'deploys')
    
    // Criar diretório de deploys se não existir
    if (!fs.existsSync(this.deploysDir)) {
      fs.mkdirSync(this.deploysDir, { recursive: true })
    }
  }

  /**
   * Deploy automatizado de nova instância
   */
  async deployNewInstance(clinicId, subdomain, config = {}) {
    try {
      console.log(`🚀 Iniciando deploy para clínica ${clinicId}`)
      console.log(`📍 Subdomínio: ${subdomain}`)

      // 1. Criar diretório da instância
      const instanceDir = await this.createInstanceDirectory(clinicId, subdomain)
      
      // 2. Copiar template
      await this.copyTemplate(instanceDir)
      
      // 3. Configurar variáveis de ambiente
      await this.configureEnvironment(instanceDir, clinicId, config)
      
      // 4. Customizar para a clínica
      await this.customizeForClinic(instanceDir, config)
      
      // 5. Deploy no Vercel
      const deployUrl = await this.deployToVercel(instanceDir, subdomain)
      
      console.log(`✅ Deploy concluído!`)
      console.log(`🌐 URL: ${deployUrl}`)
      
      return {
        success: true,
        clinicId,
        subdomain,
        deployUrl,
        instanceDir
      }

    } catch (error) {
      console.error(`❌ Erro no deploy:`, error)
      throw error
    }
  }

  /**
   * Criar diretório da instância
   */
  async createInstanceDirectory(clinicId, subdomain) {
    const instanceDir = path.join(this.deploysDir, `clinic-${clinicId}-${subdomain}`)
    
    if (fs.existsSync(instanceDir)) {
      console.log(`📁 Removendo instância existente: ${instanceDir}`)
      fs.rmSync(instanceDir, { recursive: true, force: true })
    }
    
    fs.mkdirSync(instanceDir, { recursive: true })
    console.log(`📁 Diretório criado: ${instanceDir}`)
    
    return instanceDir
  }

  /**
   * Copiar template do frontend
   */
  async copyTemplate(instanceDir) {
    console.log(`📋 Copiando template...`)
    
    // Copiar todos os arquivos exceto node_modules e dist
    const excludePatterns = ['node_modules', 'dist', '.git', '.env.local']
    
    this.copyDirectorySync(this.templateDir, instanceDir, excludePatterns)
    
    console.log(`✅ Template copiado`)
  }

  /**
   * Configurar variáveis de ambiente específicas da clínica
   */
  async configureEnvironment(instanceDir, clinicId, config) {
    console.log(`⚙️ Configurando ambiente...`)
    
    const envContent = `
# Configuração específica da clínica ${clinicId}
VITE_SUPABASE_URL=${process.env.SUPABASE_URL}
VITE_SUPABASE_ANON_KEY=${process.env.SUPABASE_ANON_KEY}
VITE_CLINIC_ID=${clinicId}
VITE_APP_NAME=${config.clinicName || 'RegiFlex'}
VITE_APP_LOGO=${config.logoUrl || ''}
VITE_PRIMARY_COLOR=${config.primaryColor || '#2563eb'}
VITE_STRIPE_PUBLISHABLE_KEY=${process.env.STRIPE_PUBLISHABLE_KEY}
`

    fs.writeFileSync(path.join(instanceDir, '.env'), envContent.trim())
    console.log(`✅ Variáveis de ambiente configuradas`)
  }

  /**
   * Customizar aplicação para a clínica
   */
  async customizeForClinic(instanceDir, config) {
    console.log(`🎨 Customizando para a clínica...`)
    
    // Customizar package.json
    const packageJsonPath = path.join(instanceDir, 'package.json')
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    
    packageJson.name = `regiflex-${config.subdomain || 'clinic'}`
    packageJson.description = `RegiFlex - ${config.clinicName || 'Clínica'}`
    
    fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2))
    
    // Customizar título da página
    const indexHtmlPath = path.join(instanceDir, 'index.html')
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8')
    
    indexHtml = indexHtml.replace(
      /<title>.*<\/title>/,
      `<title>${config.clinicName || 'RegiFlex'} - Sistema de Gestão</title>`
    )
    
    fs.writeFileSync(indexHtmlPath, indexHtml)
    
    console.log(`✅ Customização concluída`)
  }

  /**
   * Deploy no Vercel
   */
  async deployToVercel(instanceDir, subdomain) {
    console.log(`🚀 Fazendo deploy no Vercel...`)
    
    const originalDir = process.cwd()
    
    try {
      // Mudar para o diretório da instância
      process.chdir(instanceDir)
      
      // Instalar dependências
      console.log(`📦 Instalando dependências...`)
      execSync('npm install', { stdio: 'inherit' })
      
      // Build da aplicação
      console.log(`🔨 Fazendo build...`)
      execSync('npm run build', { stdio: 'inherit' })
      
      // Deploy no Vercel
      console.log(`☁️ Fazendo deploy...`)
      const deployOutput = execSync(`vercel --prod --yes --name regiflex-${subdomain}`, { 
        encoding: 'utf8',
        stdio: 'pipe'
      })
      
      // Extrair URL do deploy
      const urlMatch = deployOutput.match(/https:\/\/[^\s]+/)
      const deployUrl = urlMatch ? urlMatch[0] : `https://regiflex-${subdomain}.vercel.app`
      
      return deployUrl
      
    } finally {
      // Voltar ao diretório original
      process.chdir(originalDir)
    }
  }

  /**
   * Copiar diretório recursivamente
   */
  copyDirectorySync(src, dest, excludePatterns = []) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true })
    }

    const entries = fs.readdirSync(src, { withFileTypes: true })

    for (const entry of entries) {
      // Pular arquivos/diretórios excluídos
      if (excludePatterns.some(pattern => entry.name.includes(pattern))) {
        continue
      }

      const srcPath = path.join(src, entry.name)
      const destPath = path.join(dest, entry.name)

      if (entry.isDirectory()) {
        this.copyDirectorySync(srcPath, destPath, excludePatterns)
      } else {
        fs.copyFileSync(srcPath, destPath)
      }
    }
  }

  /**
   * Listar todas as instâncias deployadas
   */
  listInstances() {
    if (!fs.existsSync(this.deploysDir)) {
      return []
    }

    return fs.readdirSync(this.deploysDir)
      .filter(dir => dir.startsWith('clinic-'))
      .map(dir => {
        const parts = dir.split('-')
        return {
          clinicId: parts[1],
          subdomain: parts.slice(2).join('-'),
          directory: dir,
          path: path.join(this.deploysDir, dir)
        }
      })
  }

  /**
   * Remover instância
   */
  removeInstance(clinicId, subdomain) {
    const instanceDir = path.join(this.deploysDir, `clinic-${clinicId}-${subdomain}`)
    
    if (fs.existsSync(instanceDir)) {
      fs.rmSync(instanceDir, { recursive: true, force: true })
      console.log(`🗑️ Instância removida: clinic-${clinicId}-${subdomain}`)
      return true
    }
    
    return false
  }
}

// CLI Interface
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const automation = new DeployAutomation()

  // Parse argumentos
  const getArg = (name) => {
    const arg = args.find(a => a.startsWith(`--${name}=`))
    return arg ? arg.split('=')[1] : null
  }

  const command = args[0]
  
  switch (command) {
    case 'deploy':
      const clinicId = getArg('clinic-id')
      const subdomain = getArg('subdomain')
      const clinicName = getArg('clinic-name')
      
      if (!clinicId || !subdomain) {
        console.error('❌ Uso: node deploy-automation.js deploy --clinic-id=123 --subdomain=exemplo --clinic-name="Clínica Exemplo"')
        process.exit(1)
      }
      
      automation.deployNewInstance(clinicId, subdomain, { clinicName })
        .then(result => {
          console.log('🎉 Deploy concluído com sucesso!')
          console.log(JSON.stringify(result, null, 2))
        })
        .catch(error => {
          console.error('❌ Erro no deploy:', error)
          process.exit(1)
        })
      break

    case 'list':
      const instances = automation.listInstances()
      console.log('📋 Instâncias deployadas:')
      console.table(instances)
      break

    case 'remove':
      const removeClinicId = getArg('clinic-id')
      const removeSubdomain = getArg('subdomain')
      
      if (!removeClinicId || !removeSubdomain) {
        console.error('❌ Uso: node deploy-automation.js remove --clinic-id=123 --subdomain=exemplo')
        process.exit(1)
      }
      
      const removed = automation.removeInstance(removeClinicId, removeSubdomain)
      if (removed) {
        console.log('✅ Instância removida com sucesso')
      } else {
        console.log('❌ Instância não encontrada')
      }
      break

    default:
      console.log(`
🚀 RegiFlex Deploy Automation

Comandos disponíveis:

  deploy    Deploy nova instância
            --clinic-id=123 --subdomain=exemplo --clinic-name="Clínica Exemplo"
  
  list      Listar instâncias deployadas
  
  remove    Remover instância
            --clinic-id=123 --subdomain=exemplo

Exemplos:
  node deploy-automation.js deploy --clinic-id=123 --subdomain=clinica-exemplo --clinic-name="Clínica Exemplo"
  node deploy-automation.js list
  node deploy-automation.js remove --clinic-id=123 --subdomain=clinica-exemplo
`)
  }
}

export { DeployAutomation }
