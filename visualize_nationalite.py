import pandas as pd
import plotly.express as px
import dash
from dash import dcc, html, callback
from dash.dependencies import Input, Output

# Charger les données
df_auto = pd.read_csv('data-auto-entreprise-nationalite.csv')
df_societe = pd.read_csv('data-societe-nationalite.csv')
df_tout = pd.read_csv('data-tout-confondu-nationalite.csv')

# Convertir les années en type str pour assurer qu'elles sont traitées comme des catégories discrètes
df_auto['annee'] = df_auto['annee'].astype(str)
df_societe['annee'] = df_societe['annee'].astype(str)
df_tout['annee'] = df_tout['annee'].astype(str)

# Initialiser l'application Dash
app = dash.Dash(__name__, title="Évolution des nationalités (2015-2024)")

# Définir la mise en page de l'application
app.layout = html.Div([
    html.H1("Évolution du nombre d'itérations par nationalité (2015-2024)", 
            style={'textAlign': 'center', 'marginBottom': 30, 'marginTop': 20}),
    
    html.Div([
        html.Label("Sélectionner le type de données:"),
        dcc.RadioItems(
            id='dataset-radio',
            options=[
                {'label': 'Auto-entrepreneurs', 'value': 'auto'},
                {'label': 'Sociétés', 'value': 'societe'},
                {'label': 'Tout confondu', 'value': 'tout'}
            ],
            value='tout',
            labelStyle={'display': 'inline-block', 'marginRight': '15px'}
        ),
    ], style={'marginBottom': '20px', 'padding': '10px 10px'}),
    
    html.Div([
        dcc.Tabs([
            dcc.Tab(label="Top nationalités", children=[
                html.Div([
                    html.Label("Nombre de nationalités les plus populaires:"),
                    dcc.Slider(
                        id='top-n-slider',
                        min=1,
                        max=20,
                        step=1,
                        value=5,
                        marks={i: str(i) for i in range(1, 21, 2)},
                    ),
                ], style={'padding': '20px 10px'}),
                dcc.Graph(id='graph-top')
            ]),
            dcc.Tab(label="Nationalités sélectionnées", children=[
                html.Div([
                    html.Label("Sélectionner les nationalités:"),
                    dcc.Dropdown(
                        id='nationalites-dropdown',
                        multi=True
                    ),
                ], style={'padding': '20px 10px'}),
                dcc.Graph(id='graph-selected')
            ]),
        ]),
    ], style={'padding': '0 10px'}),
    
    html.Footer(
        html.P("Visualisation interactive des nationalités avec Dash et Plotly.",
               style={'textAlign': 'center', 'marginTop': 30, 'marginBottom': 20}),
    )
])

# Callback pour mettre à jour les options du dropdown basé sur le dataset sélectionné
@callback(
    [Output('nationalites-dropdown', 'options'),
     Output('nationalites-dropdown', 'value')],
    [Input('dataset-radio', 'value')]
)
def update_dropdown_options(selected_dataset):
    if selected_dataset == 'auto':
        df = df_auto
    elif selected_dataset == 'societe':
        df = df_societe
    else:
        df = df_tout
    
    nationalites = sorted(df['nationalite'].unique())
    options = [{'label': nat, 'value': nat} for nat in nationalites]
    default_values = nationalites[:5]  # Sélectionner les 5 premières nationalités par défaut
    
    return options, default_values

# Callback pour mettre à jour le graphique des nationalités sélectionnées
@callback(
    Output('graph-selected', 'figure'),
    [Input('nationalites-dropdown', 'value'),
     Input('dataset-radio', 'value')]
)
def update_selected_graph(selected_nationalites, selected_dataset):
    if selected_dataset == 'auto':
        df = df_auto
        title_prefix = "Auto-entrepreneurs"
    elif selected_dataset == 'societe':
        df = df_societe
        title_prefix = "Sociétés"
    else:
        df = df_tout
        title_prefix = "Tout confondu"
    
    if not selected_nationalites:
        # Si aucune nationalité n'est sélectionnée, utilisez toutes les nationalités
        selected_nationalites = sorted(df['nationalite'].unique())
    
    filtered_df = df[df['nationalite'].isin(selected_nationalites)]
    
    fig = px.line(filtered_df, x='annee', y='iterations', color='nationalite',
                  title=f'{title_prefix} - Évolution des {len(selected_nationalites)} nationalités sélectionnées',
                  labels={'annee': 'Année', 'iterations': 'Nombre d\'itérations', 'nationalite': 'Nationalité'},
                  markers=True, line_shape='linear')
    
    # Appliquer le style
    fig.update_layout(
        legend_title_text='Nationalités',
        xaxis_title='Année',
        yaxis_title='Nombre d\'itérations',
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        template='plotly_white',
        height=600,
        xaxis=dict(showgrid=True, gridwidth=0.5, gridcolor='lightgrey'),
        yaxis=dict(showgrid=True, gridwidth=0.5, gridcolor='lightgrey'),
    )
    fig.update_traces(line=dict(width=2.5), opacity=0.85)
    fig.update_traces(
        hovertemplate='<b>%{fullData.name}</b><br>Année: %{x}<br>Itérations: %{y:,.0f}<extra></extra>'
    )
    
    return fig

# Callback pour mettre à jour le graphique des top nationalités
@callback(
    Output('graph-top', 'figure'),
    [Input('top-n-slider', 'value'),
     Input('dataset-radio', 'value')]
)
def update_top_graph(top_n, selected_dataset):
    if selected_dataset == 'auto':
        df = df_auto
        title_prefix = "Auto-entrepreneurs"
    elif selected_dataset == 'societe':
        df = df_societe
        title_prefix = "Sociétés"
    else:
        df = df_tout
        title_prefix = "Tout confondu"
    
    top_nationalites = df.groupby('nationalite')['iterations'].mean().nlargest(top_n).index.tolist()
    filtered_df = df[df['nationalite'].isin(top_nationalites)]
    
    fig = px.line(filtered_df, x='annee', y='iterations', color='nationalite',
                  title=f'{title_prefix} - Top {top_n} des nationalités par nombre d\'itérations',
                  labels={'annee': 'Année', 'iterations': 'Nombre d\'itérations', 'nationalite': 'Nationalité'},
                  markers=True, line_shape='linear')
    
    # Appliquer le style
    fig.update_layout(
        legend_title_text='Nationalités',
        xaxis_title='Année',
        yaxis_title='Nombre d\'itérations',
        legend=dict(orientation="h", yanchor="bottom", y=1.02, xanchor="right", x=1),
        template='plotly_white',
        height=600,
        xaxis=dict(showgrid=True, gridwidth=0.5, gridcolor='lightgrey'),
        yaxis=dict(showgrid=True, gridwidth=0.5, gridcolor='lightgrey'),
    )
    fig.update_traces(line=dict(width=3), opacity=1)
    fig.update_traces(
        hovertemplate='<b>%{fullData.name}</b><br>Année: %{x}<br>Itérations: %{y:,.0f}<extra></extra>'
    )
    
    return fig

# Lancer l'application
if __name__ == '__main__':
    print("Démarrage de l'application Dash...")
    print("Accédez à l'application dans votre navigateur à l'adresse: http://127.0.0.1:8050/")
    app.run_server(debug=True) 